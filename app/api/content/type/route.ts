import { NextRequest, NextResponse } from 'next/server';
import { ContentItem } from '@/types';
import { promises as fs } from 'fs';
import path from 'path';

// 로컬 파일 경로
const CONTENT_FILE_PATH = path.join(process.cwd(), 'data', 'contents.json');

// 메모리 기반 저장소 (Vercel 환경에서 사용)
let memoryStorage: ContentItem[] = [];

// 타입별 배열 분리
const TYPE_RANGES = {
  appstory: { min: 1, max: 9999 },
  news: { min: 10000, max: 19999 }
};

// 데이터 디렉토리 생성 및 파일 초기화
async function ensureDataFile() {
  try {
    const dataDir = path.dirname(CONTENT_FILE_PATH);
    await fs.mkdir(dataDir, { recursive: true });
    
    // 파일이 없으면 빈 배열로 초기화
    try {
      await fs.access(CONTENT_FILE_PATH);
    } catch {
      await fs.writeFile(CONTENT_FILE_PATH, JSON.stringify([]));
    }
  } catch {
    // 에러 무시
  }
}

// 콘텐츠 로드
async function loadContents(): Promise<ContentItem[]> {
  try {
    // Vercel 환경에서는 메모리 저장소만 사용
    if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
      return memoryStorage;
    }
    
    // 로컬 환경에서는 파일에서 로드
    await ensureDataFile();
    const data = await fs.readFile(CONTENT_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

// 타입별 콘텐츠 분리
function separateContentsByType(contents: ContentItem[]) {
  const separated: Record<string, ContentItem[]> = {
    appstory: [],
    news: []
  };

  contents.forEach(content => {
    if (content.type === 'appstory' || content.type === 'news') {
      separated[content.type].push(content);
    }
  });

  // 각 타입별로 ID 범위 검증 및 정리
  Object.entries(separated).forEach(([type, typeContents]) => {
    const range = TYPE_RANGES[type as keyof typeof TYPE_RANGES];
    separated[type] = typeContents.filter(content => {
      const id = parseInt(content.id);
      return id >= range.min && id <= range.max;
    });
  });

  return separated;
}

// GET: 타입별 콘텐츠 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'appstory' | 'news' | null;
    
    if (!type || !['appstory', 'news'].includes(type)) {
      return NextResponse.json({ error: '유효한 타입이 필요합니다.' }, { status: 400 });
    }

    const contents = await loadContents();
    const separated = separateContentsByType(contents);
    
    // 요청된 타입의 콘텐츠만 반환
    const typeContents = separated[type] || [];
    
    // 최신순 정렬
    typeContents.sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());

    return NextResponse.json({
      type,
      count: typeContents.length,
      contents: typeContents,
      range: TYPE_RANGES[type]
    });
  } catch (error) {
    return NextResponse.json({ 
      error: '타입별 콘텐츠 조회에 실패했습니다.',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}

// POST: 타입별 콘텐츠 저장 (배열 분리)
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'appstory' | 'news' | null;
    
    if (!type || !['appstory', 'news'].includes(type)) {
      return NextResponse.json({ error: '유효한 타입이 필요합니다.' }, { status: 400 });
    }

    const body: ContentItem[] = await request.json();
    
    if (!Array.isArray(body)) {
      return NextResponse.json({ error: '콘텐츠 배열이 필요합니다.' }, { status: 400 });
    }

    // 타입별로 필터링 및 ID 범위 검증
    const range = TYPE_RANGES[type];
    const validContents = body.filter(content => {
      if (content.type !== type) return false;
      const id = parseInt(content.id);
      return id >= range.min && id <= range.max;
    });

    // 기존 콘텐츠 로드
    const existingContents = await loadContents();
    
    // 다른 타입의 콘텐츠는 유지하고 현재 타입만 교체
    const otherTypeContents = existingContents.filter(content => content.type !== type);
    const updatedContents = [...otherTypeContents, ...validContents];

    // 메모리 저장소 업데이트
    if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
      memoryStorage = [...updatedContents];
    } else {
      // 로컬 파일 저장
      await ensureDataFile();
      await fs.writeFile(CONTENT_FILE_PATH, JSON.stringify(updatedContents, null, 2));
    }

    // Blob 동기화
    try {
      const origin = new URL(request.url).origin;
      await fetch(`${origin}/api/data/contents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedContents),
      });
    } catch (error) {
      console.warn('Blob 동기화 실패:', error);
    }

    return NextResponse.json({
      success: true,
      type,
      count: validContents.length,
      totalCount: updatedContents.length,
      range
    });
  } catch (error) {
    return NextResponse.json({ 
      error: '타입별 콘텐츠 저장에 실패했습니다.',
      details: error instanceof Error ? error.message : '알 수 없는 오류'
    }, { status: 500 });
  }
}
