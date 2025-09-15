import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { put, list } from '@vercel/blob';

// Events 앱 정보만 저장하는 전용 파일
const EVENTS_FILENAME = 'events.json';
const LOCAL_EVENTS_PATH = path.join(process.cwd(), 'data', 'events.json');

// Vercel 환경에서의 임시 메모리 저장소 (Blob 실패 시 폴백)
let memoryEvents: string[] = [];

async function ensureLocalFile() {
  const dir = path.dirname(LOCAL_EVENTS_PATH);
  await fs.mkdir(dir, { recursive: true });
  try {
    await fs.access(LOCAL_EVENTS_PATH);
  } catch {
    await fs.writeFile(LOCAL_EVENTS_PATH, JSON.stringify([]));
  }
}

async function readFromLocal(): Promise<string[]> {
  await ensureLocalFile();
  const data = await fs.readFile(LOCAL_EVENTS_PATH, 'utf-8');
  return JSON.parse(data || '[]');
}

async function writeToLocal(events: string[]) {
  await ensureLocalFile();
  await fs.writeFile(LOCAL_EVENTS_PATH, JSON.stringify(events, null, 2));
}

// GET: 로컬 파일 우선, Blob 폴백으로 Events 앱 정보 반환
export async function GET() {
  try {
    // 1) 먼저 로컬 파일에서 읽기 (개발/배포 환경 모두)
    try {
      const local = await readFromLocal();
      if (local && local.length > 0) {
        return NextResponse.json(local);
      }
    } catch (error) {
    }

    const isProd = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
    if (isProd) {
      // 2) Blob에서 최신 JSON 파일 시도
      try {
        const { blobs } = await list({ prefix: EVENTS_FILENAME, limit: 100 });
        if (blobs && blobs.length > 0) {
          // 최신순 정렬 (uploadedAt 기준)
          blobs.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
          const latestBlob = blobs[0];
          
          const res = await fetch(latestBlob.url, { cache: 'no-store' });
          if (res.ok) {
            const json = await res.json();
            const data = Array.isArray(json) ? json : [];
            
            // 메모리와 동기화
            memoryEvents = [...data];
            
            return NextResponse.json(data);
          }
        }
      } catch (error) {
        console.warn('[Events API] Blob 조회 실패:', error);
      }

      // 3) 메모리 폴백
      if (memoryEvents.length > 0) {
        return NextResponse.json(memoryEvents);
      }
    }

    // 4) 모든 방법 실패 시 빈 배열
    return NextResponse.json([]);
  } catch (error) {
    console.error('[Events API] GET 오류:', error);
    return NextResponse.json([], { status: 200 });
  }
}

// POST: Events 앱 정보를 받아 기존 데이터와 병합 후 저장 (오버라이트 방지)
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as unknown;
    const newEvents = Array.isArray(body) ? body : [];

    const isProd = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
    if (isProd) {
      // 1. 기존 Events 데이터 로드 (오버라이트 방지)
      let currentEvents: string[] = [];
      try {
        const { blobs } = await list({ prefix: EVENTS_FILENAME, limit: 1 });
        if (blobs && blobs.length > 0) {
          const res = await fetch(blobs[0].url, { cache: 'no-store' });
          if (res.ok) {
            const json = await res.json();
            currentEvents = Array.isArray(json) ? json : [];
          }
        }
      } catch (error) {
        console.warn('[Events Blob] 기존 데이터 로드 실패, 메모리 사용:', error);
        currentEvents = memoryEvents;
      }
      
      // 2. 기존 데이터와 새 데이터 병합 (중복 제거)
      const mergedEvents = Array.from(new Set([...currentEvents, ...newEvents]));
(`[Events Blob] 병합 완료: 기존 ${currentEvents.length} + 새 ${newEvents.length} = 총 ${mergedEvents.length}`);
      
      // 3. 병합된 데이터 저장
      let blobSaved = false;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
(`[Events Blob] 저장 시도 ${attempt}/3`);
          await put(EVENTS_FILENAME, JSON.stringify(mergedEvents, null, 2), {
            access: 'public',
            contentType: 'application/json; charset=utf-8',
            addRandomSuffix: false,
          });
(`[Events Blob] 저장 성공 (시도 ${attempt})`);
          blobSaved = true;
          break;
        } catch (error) {
          console.error(`[Events Blob] 저장 실패 (시도 ${attempt}):`, error);
          if (attempt === 3) {
            console.error('[Events Blob] 모든 시도 실패, 메모리 폴백 사용');
          }
        }
      }
      
      // 메모리도 항상 업데이트
      memoryEvents = [...mergedEvents];
      
      if (blobSaved) {
        return NextResponse.json({ 
          success: true, 
          storage: 'blob',
          data: mergedEvents // 병합된 최종 데이터 반환
        });
      } else {
        return NextResponse.json({ 
          success: true, 
          storage: 'memory',
          data: mergedEvents, // 병합된 최종 데이터 반환
          warning: 'Blob save failed after 3 attempts; using in-memory fallback' 
        });
      }
    }

    // 로컬 파일 저장 (병합 로직)
    const currentLocal = await readFromLocal();
    const mergedLocal = Array.from(new Set([...currentLocal, ...newEvents]));
    await writeToLocal(mergedLocal);
    return NextResponse.json({ 
      success: true, 
      storage: 'local',
      data: mergedLocal // 병합된 최종 데이터 반환
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to save events apps' }, { status: 500 });
  }
}
