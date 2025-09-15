import { NextRequest, NextResponse } from 'next/server';
import { loadFeaturedAppsFromBlob, saveFeaturedAppsToBlob } from '@/lib/data-loader';
import { put, list } from '@vercel/blob';
import { promises as fs } from 'fs';
import path from 'path';

// 런타임/캐시 설정
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// 상수
const FEATURED_FILE_NAME = 'featured-apps.json';
const LOCAL_FEATURED_PATH = path.join(process.cwd(), 'data', 'featured-apps.json');

// 메모리 폴백
let memoryFeatured: { featured: string[]; events: string[] } = { featured: [], events: [] };

// 헬퍼 함수들
type FeaturedSets = { featured: string[]; events: string[] };

async function readFromBlobLatest(): Promise<FeaturedSets | null> {
  const { blobs } = await list({ prefix: FEATURED_FILE_NAME, limit: 100 });
  if (!blobs || blobs.length === 0) return null;

  blobs.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  const latest = blobs[0];
  const res = await fetch(latest.url, { cache: 'no-store' });
  if (!res.ok) return null;

  const json = await res.json();
  const data: FeaturedSets = {
    featured: Array.isArray(json?.featured) ? json.featured : [],
    events: Array.isArray(json?.events) ? json.events : [],
  };
  return data;
}

async function writeBlobSets(sets: FeaturedSets): Promise<"blob" | "memory" | "local"> {
  const isProd = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
  
  // Vercel 환경에서 Blob 저장 시도
  if (isProd) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await put(FEATURED_FILE_NAME, JSON.stringify(sets, null, 2), {
          access: 'public',
          contentType: 'application/json; charset=utf-8',
          addRandomSuffix: false,
        });
        memoryFeatured = { ...sets };
        return "blob";
      } catch (e) {
        console.error(`[Blob] 저장 실패 (시도 ${attempt}):`, e);
        if (attempt === 3) {
          // Blob 저장 실패 시 메모리만 사용 (Vercel 파일시스템은 읽기전용)
          memoryFeatured = { ...sets };
('[Memory] Vercel 환경에서 메모리 저장 사용');
          return "memory";
        }
      }
    }
  }
  
  // 개발 환경: 로컬 파일 저장
  const dir = path.dirname(LOCAL_FEATURED_PATH);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(LOCAL_FEATURED_PATH, JSON.stringify(sets, null, 2));
  return "local";
}

async function readFromLocal(): Promise<FeaturedSets> {
  try {
    const data = await fs.readFile(LOCAL_FEATURED_PATH, 'utf-8');
    return JSON.parse(data || '{"featured": [], "events": []}');
  } catch {
    return { featured: [], events: [] };
  }
}

// GET: 로컬 파일 우선, Blob 폴백으로 Featured/Events 앱 정보 조회
export async function GET() {
  try {
    // 1) 먼저 로컬 파일에서 읽기 (개발/배포 환경 모두)
    try {
      const local = await readFromLocal();
      if (local && (local.featured.length > 0 || local.events.length > 0)) {
        return NextResponse.json(local, { headers: { 'Cache-Control': 'no-store' } });
      }
    } catch (error) {
    }

    const isProd = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
    if (isProd) {
      // 2) Blob에서 최신 JSON 파일 시도
      try {
        const data = await readFromBlobLatest();
        if (data) {
          memoryFeatured = { ...data };
          return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } });
        }
      } catch (error) {
        console.warn('[Featured/Events API] Blob 조회 실패:', error);
      }
      
      // 3) 메모리 폴백
      if (memoryFeatured.featured.length > 0 || memoryFeatured.events.length > 0) {
        return NextResponse.json(memoryFeatured, { headers: { 'Cache-Control': 'no-store' } });
      }
    }

    // 4) 모든 방법 실패 시 빈 세트 반환
    return NextResponse.json({ featured: [], events: [] }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    console.error('[Featured/Events API] GET 오류:', error);
    return NextResponse.json({ featured: [], events: [] }, { status: 200, headers: { 'Cache-Control': 'no-store' } });
  }
}

// POST: 완전 세트 저장 전용
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const featured = Array.isArray(body?.featured) ? body.featured : null;
    const events = Array.isArray(body?.events) ? body.events : null;

    if (!featured || !events) {
      return NextResponse.json(
        { success: false, error: "Body must be { featured: string[], events: string[] }" },
        { status: 400 }
      );
    }

    const storage = await writeBlobSets({ featured, events });
    return NextResponse.json({ success: true, storage }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to save featured apps' }, { status: 500 });
  }
}

// PUT: 개별 토글 지원
/** PUT body: { appId: string, type: 'featured' | 'events', action: 'add' | 'remove' } */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const appId = String(body?.appId || '');
    const type = body?.type === 'featured' ? 'featured' : 'events';
    const action = body?.action === 'remove' ? 'remove' : 'add';

(`[PUT] 토글 요청: ${appId} ${type} ${action}`);

    if (!appId) {
      console.error('[PUT] appId 누락');
      return NextResponse.json({ success: false, error: 'appId required' }, { status: 400 });
    }

    // 현재 세트 로드 (로컬 파일 우선)
    let sets: FeaturedSets | null = null;
    
    // 1) 먼저 로컬 파일에서 읽기
    try {
      sets = await readFromLocal();
      if (sets && (sets.featured.length > 0 || sets.events.length > 0)) {
(`[PUT] 로컬 파일에서 현재 세트 로드: Featured: ${sets.featured.length}, Events: ${sets.events.length}`);
      } else {
        sets = null;
      }
    } catch (error) {
      sets = null;
    }

    // 2) 로컬 파일이 없으면 Blob에서 읽기
    if (!sets) {
      const isProd = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
      if (isProd) {
        sets = await readFromBlobLatest();
        if (!sets) {
          sets = { ...memoryFeatured };
        }
      }
    }
    
    if (!sets) sets = { featured: [], events: [] };

    const next: FeaturedSets = {
      featured: Array.from(new Set(sets.featured)),
      events: Array.from(new Set(sets.events)),
    };

    const target = type === 'featured' ? next.featured : next.events;

    if (action === 'add') {
      if (!target.includes(appId)) {
        target.push(appId);
      }
    } else {
      const idx = target.indexOf(appId);
      if (idx >= 0) {
        target.splice(idx, 1);
      }
    }

    const storage = await writeBlobSets(next);
    
    return NextResponse.json({ success: true, storage, ...next }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to toggle featured/events' }, { status: 500 });
  }
}

// PATCH: 토글 지원 - add/remove 처리 (기존 호환성 유지)
/** PATCH body: { list: 'featured' | 'events', op: 'add' | 'remove', id: string } */
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const list: 'featured' | 'events' = body?.list;
    const op: 'add' | 'remove' = body?.op;
    const id: string = body?.id;

(`[PATCH] 요청 받음: ${list} ${op} ${id}`);

    if (!['featured', 'events'].includes(list) || !['add', 'remove'].includes(op) || !id) {
      console.error(`[PATCH] 잘못된 요청:`, { list, op, id });
      return NextResponse.json(
        { success: false, error: "Body must be { list: 'featured'|'events', op: 'add'|'remove', id: string }" },
        { status: 400 }
      );
    }

    // 최신 세트 로드 (로컬 파일 우선)
    let sets: FeaturedSets | null = null;
    
    // 1) 먼저 로컬 파일에서 읽기
    try {
      sets = await readFromLocal();
      if (sets && (sets.featured.length > 0 || sets.events.length > 0)) {
(`[PATCH] 로컬 파일에서 현재 세트 로드: Featured: ${sets.featured.length}, Events: ${sets.events.length}`);
      } else {
        sets = null;
      }
    } catch (error) {
      sets = null;
    }

    // 2) 로컬 파일이 없으면 Blob에서 읽기
    if (!sets) {
      const isProd = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
      if (isProd) {
        sets = await readFromBlobLatest();
        if (!sets) {
          // Vercel 환경에서는 메모리 폴백만 사용
          sets = { ...memoryFeatured };
        }
      }
    }
    
    if (!sets) sets = { featured: [], events: [] };

    const next: FeaturedSets = {
      featured: Array.from(new Set(sets.featured)),
      events: Array.from(new Set(sets.events)),
    };

    const target = list === 'featured' ? next.featured : next.events;

    if (op === 'add') {
      if (!target.includes(id)) {
        target.push(id);
      }
    } else {
      const idx = target.indexOf(id);
      if (idx >= 0) {
        target.splice(idx, 1);
      }
    }

    const storage = await writeBlobSets(next);
    
    return NextResponse.json({ success: true, storage, ...next }, { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to toggle featured/events' }, { status: 500 });
  }
}