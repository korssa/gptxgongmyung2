import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { put, list } from '@vercel/blob';

// Featured 앱 정보만 저장하는 전용 파일
const FEATURED_FILENAME = 'featured.json';
const LOCAL_FEATURED_PATH = path.join(process.cwd(), 'data', 'featured.json');

// Vercel 환경에서의 임시 메모리 저장소 (Blob 실패 시 폴백)
let memoryFeatured: string[] = [];

async function ensureLocalFile() {
  const dir = path.dirname(LOCAL_FEATURED_PATH);
  await fs.mkdir(dir, { recursive: true });
  try {
    await fs.access(LOCAL_FEATURED_PATH);
  } catch {
    await fs.writeFile(LOCAL_FEATURED_PATH, JSON.stringify([]));
  }
}

async function readFromLocal(): Promise<string[]> {
  await ensureLocalFile();
  const data = await fs.readFile(LOCAL_FEATURED_PATH, 'utf-8');
  return JSON.parse(data || '[]');
}

async function writeToLocal(featured: string[]) {
  await ensureLocalFile();
  await fs.writeFile(LOCAL_FEATURED_PATH, JSON.stringify(featured, null, 2));
}

// GET: 로컬 파일 우선, Blob 폴백으로 Featured 앱 정보 반환
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
        const { blobs } = await list({ prefix: FEATURED_FILENAME, limit: 100 });
        if (blobs && blobs.length > 0) {
          // 최신순 정렬 (uploadedAt 기준)
          blobs.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
          const latestBlob = blobs[0];
          
          const res = await fetch(latestBlob.url, { cache: 'no-store' });
          if (res.ok) {
            const json = await res.json();
            const data = Array.isArray(json) ? json : [];
            
            // 메모리와 동기화
            memoryFeatured = [...data];
            
            return NextResponse.json(data);
          }
        }
      } catch (error) {
        console.warn('[Featured API] Blob 조회 실패:', error);
      }

      // 3) 메모리 폴백
      if (memoryFeatured.length > 0) {
        return NextResponse.json(memoryFeatured);
      }
    }

    // 4) 모든 방법 실패 시 빈 배열
    return NextResponse.json([]);
  } catch (error) {
    console.error('[Featured API] GET 오류:', error);
    return NextResponse.json([], { status: 200 });
  }
}

// POST: Featured 앱 정보를 받아 기존 데이터와 병합 후 저장 (오버라이트 방지)
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as unknown;
    const newFeatured = Array.isArray(body) ? body : [];

    const isProd = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
    if (isProd) {
      // 1. 기존 Featured 데이터 로드 (오버라이트 방지)
      let currentFeatured: string[] = [];
      try {
        const { blobs } = await list({ prefix: FEATURED_FILENAME, limit: 1 });
        if (blobs && blobs.length > 0) {
          const res = await fetch(blobs[0].url, { cache: 'no-store' });
          if (res.ok) {
            const json = await res.json();
            currentFeatured = Array.isArray(json) ? json : [];
          }
        }
      } catch (error) {
        console.warn('[Featured Blob] 기존 데이터 로드 실패, 메모리 사용:', error);
        currentFeatured = memoryFeatured;
      }
      
      // 2. 기존 데이터와 새 데이터 병합 (중복 제거)
      const mergedFeatured = Array.from(new Set([...currentFeatured, ...newFeatured]));
(`[Featured Blob] 병합 완료: 기존 ${currentFeatured.length} + 새 ${newFeatured.length} = 총 ${mergedFeatured.length}`);
      
      // 3. 병합된 데이터 저장
      let blobSaved = false;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
(`[Featured Blob] 저장 시도 ${attempt}/3`);
          await put(FEATURED_FILENAME, JSON.stringify(mergedFeatured, null, 2), {
            access: 'public',
            contentType: 'application/json; charset=utf-8',
            addRandomSuffix: false,
          });
(`[Featured Blob] 저장 성공 (시도 ${attempt})`);
          blobSaved = true;
          break;
        } catch (error) {
          console.error(`[Featured Blob] 저장 실패 (시도 ${attempt}):`, error);
          if (attempt === 3) {
            console.error('[Featured Blob] 모든 시도 실패, 메모리 폴백 사용');
          }
        }
      }
      
      // 메모리도 항상 업데이트
      memoryFeatured = [...mergedFeatured];
      
      if (blobSaved) {
        return NextResponse.json({ 
          success: true, 
          storage: 'blob',
          data: mergedFeatured // 병합된 최종 데이터 반환
        });
      } else {
        return NextResponse.json({ 
          success: true, 
          storage: 'memory',
          data: mergedFeatured, // 병합된 최종 데이터 반환
          warning: 'Blob save failed after 3 attempts; using in-memory fallback' 
        });
      }
    }

    // 로컬 파일 저장 (병합 로직)
    const currentLocal = await readFromLocal();
    const mergedLocal = Array.from(new Set([...currentLocal, ...newFeatured]));
    await writeToLocal(mergedLocal);
    return NextResponse.json({ 
      success: true, 
      storage: 'local',
      data: mergedLocal // 병합된 최종 데이터 반환
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to save featured apps' }, { status: 500 });
  }
}
