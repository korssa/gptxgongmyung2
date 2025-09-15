import { NextRequest, NextResponse } from 'next/server';
import { ContentItem, ContentFormData } from '@/types';
import { promises as fs } from 'fs';
import path from 'path';
import { list, put, del } from '@vercel/blob';

// 로컬 파일 경로
const CONTENT_FILE_PATH = path.join(process.cwd(), 'data', 'contents.json');

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
    
  }
}

// 콘텐츠 로드
async function loadContents(): Promise<ContentItem[]> {
  try {
    // Vercel 환경에서는 메모리 저장소만 사용 (무한 재귀 방지)
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

// 메모리 기반 저장소 (Vercel 환경에서 사용)
let memoryStorage: ContentItem[] = [];

// 콘텐츠 저장
async function saveContents(contents: ContentItem[]) {
  try {
    // Vercel 환경에서는 메모리 저장소 사용
    if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
      memoryStorage = [...contents];
      return;
    }
    
    // 로컬 환경에서는 파일 저장
    await ensureDataFile();
    const jsonData = JSON.stringify(contents, null, 2);
    await fs.writeFile(CONTENT_FILE_PATH, jsonData);
  } catch (error) {
    throw new Error(`콘텐츠 저장 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  }
}

// Vercel Blob에서 타입별 콘텐츠 로드
async function loadContentsByTypeFromBlob(type: 'appstory' | 'news' | 'memo' | 'memo2'): Promise<ContentItem[]> {
  try {
    // 1) 먼저 로컬 파일에서 읽기 (개발/배포 환경 모두)
    try {
      await ensureDataFile();
      const data = await fs.readFile(CONTENT_FILE_PATH, 'utf-8');
      const allContents = JSON.parse(data);
      const typeContents = allContents.filter((content: ContentItem) => content.type === type);
      if (typeContents && typeContents.length > 0) {
        return typeContents;
      }
    } catch (error) {
    }

    // 2) Vercel 환경에서는 Blob에서 직접 읽기 (개별 JSON 파일 방식)
    if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
      try {
        const folderPath = `content-${type}`;
        const { blobs } = await list({ prefix: `${folderPath}/`, limit: 100 });
        const jsonFiles = blobs.filter(blob => blob.pathname.endsWith('.json'));
        
        const contents: ContentItem[] = [];
        for (const jsonFile of jsonFiles) {
          try {
            const response = await fetch(jsonFile.url, { cache: 'no-store' });
            if (response.ok) {
              const data = await response.json();
              if (data.id) {
                contents.push(data);
              }
            }
          } catch (error) {
            console.warn(`[Content API] JSON 파일 읽기 실패: ${jsonFile.pathname}`, error);
          }
        }
        
        if (contents.length > 0) {
          return contents;
        }
      } catch (error) {
      }
    }

    // 3) 메모리 저장소에서 읽기 (마지막 수단)
    if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
      const typeContents = memoryStorage.filter(content => content.type === type);
      if (typeContents.length > 0) {
        return typeContents;
      }
    }

    return [];
  } catch (error) {
    console.error(`[Content API] ${type} 콘텐츠 로드 오류:`, error);
    return [];
  }
}

// GET: 모든 콘텐츠 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'appstory' | 'news' | 'memo' | 'memo2' | null;
    const published = searchParams.get('published');
    
    let contents: ContentItem[] = [];

    if (type) {
      // 특정 타입만 조회 (Vercel Blob 방식)
      contents = await loadContentsByTypeFromBlob(type);
    } else {
      // 모든 타입 조회 (기존 방식 유지)
      try {
        contents = await loadContents();
      } catch {
        contents = [];
      }
    }

    // 게시된 콘텐츠만 필터링
    if (published === 'true') {
      contents = contents.filter(content => content.isPublished);
    }

    // 최신순 정렬
    contents.sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());

    return NextResponse.json(contents);
  } catch (error) {
    console.error('콘텐츠 조회 오류:', error);
    return NextResponse.json({ error: '콘텐츠 조회에 실패했습니다.' }, { status: 500 });
  }
}

// POST: 새 콘텐츠 생성
export async function POST(request: NextRequest) {
  try {
    const body: ContentFormData & { imageUrl?: string } = await request.json();
    
    // 필수 필드 검증
    if (!body.title?.trim()) {
      return NextResponse.json({ error: '제목은 필수입니다.' }, { status: 400 });
    }
    if (!body.author?.trim()) {
      return NextResponse.json({ error: '작성자는 필수입니다.' }, { status: 400 });
    }
    if (!body.content?.trim()) {
      return NextResponse.json({ error: '내용은 필수입니다.' }, { status: 400 });
    }
    if (!body.type) {
      return NextResponse.json({ error: '콘텐츠 타입은 필수입니다.' }, { status: 400 });
    }
    
    const contents = await loadContents();
    
    // ID 범위 분리: App Story (1-9999), News (10000-19999), Memo (20000-29999), Memo2 (30000-39999)
    const baseId = body.type === 'appstory' ? 1 : body.type === 'news' ? 10000 : body.type === 'memo' ? 20000 : 30000;
    const maxId = body.type === 'appstory' ? 9999 : body.type === 'news' ? 19999 : body.type === 'memo' ? 29999 : 39999;
    
    // 기존 ID와 겹치지 않는 고유 ID 생성
    let id: string;
    let attempts = 0;
    const maxAttempts = 100;
    
    do {
      const timestamp = Date.now() + attempts;
      const randomOffset = Math.floor(Math.random() * (maxId - baseId + 1));
      id = (baseId + randomOffset).toString();
      attempts++;
      
      // 이미 존재하는 ID인지 확인
      const existingContent = contents.find(c => c.id === id);
      if (!existingContent) break;
      
      if (attempts >= maxAttempts) {
        // 최대 시도 횟수 초과 시 타임스탬프 기반 ID 생성
        id = (baseId + (Date.now() % (maxId - baseId + 1))).toString();
        break;
      }
    } while (true);
    
    const newContent: ContentItem = {
      id,
      title: body.title.trim(),
      content: body.content.trim(),
      author: body.author.trim(),
      publishDate: new Date().toISOString(),
      type: body.type,
      tags: body.tags ? body.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
      isPublished: body.isPublished || false,
      imageUrl: body.imageUrl,
    };

    // 기존 방식: 전체 콘텐츠에 추가 (로컬 파일용)
    contents.push(newContent);
    await saveContents(contents);

    // 새로운 방식: 개별 JSON 파일로 Vercel Blob에 저장
    try {
      const folderPath = `content-${newContent.type}`;
      const jsonFilename = `${newContent.id}.json`;
      const jsonBlob = await put(`${folderPath}/${jsonFilename}`, JSON.stringify(newContent, null, 2), {
        access: 'public',
        contentType: 'application/json',
      });
(`✅ ${newContent.type} 콘텐츠 Blob 저장 성공: ${jsonBlob.url}`);
    } catch (error) {
      console.error(`❌ ${newContent.type} 콘텐츠 Blob 저장 실패:`, error);
    }

    return NextResponse.json(newContent, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    return NextResponse.json({ 
      error: '콘텐츠 생성에 실패했습니다.',
      details: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// PUT: 콘텐츠 업데이트
export async function PUT(request: NextRequest) {
  try {
    const body: { id: string } & Partial<ContentFormData> & { imageUrl?: string } = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: '콘텐츠 ID는 필수입니다.' }, { status: 400 });
    }

    // 필수 필드 검증 (업데이트 시에도)
    if (updateData.title !== undefined && !updateData.title.trim()) {
      return NextResponse.json({ error: '제목은 필수입니다.' }, { status: 400 });
    }
    if (updateData.author !== undefined && !updateData.author.trim()) {
      return NextResponse.json({ error: '작성자는 필수입니다.' }, { status: 400 });
    }
    if (updateData.content !== undefined && !updateData.content.trim()) {
      return NextResponse.json({ error: '내용은 필수입니다.' }, { status: 400 });
    }

    const contents = await loadContents();
    const contentIndex = contents.findIndex(content => content.id === id);
    
    if (contentIndex === -1) {
      return NextResponse.json({ error: '콘텐츠를 찾을 수 없습니다.' }, { status: 404 });
    }

    contents[contentIndex] = {
      ...contents[contentIndex],
      ...updateData,
      title: updateData.title?.trim() ?? contents[contentIndex].title,
      author: updateData.author?.trim() ?? contents[contentIndex].author,
      content: updateData.content?.trim() ?? contents[contentIndex].content,
      tags: updateData.tags ? updateData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : contents[contentIndex].tags,
    };

    await saveContents(contents);

    // 개별 JSON 파일로 Vercel Blob에 저장
    try {
      const folderPath = `content-${contents[contentIndex].type}`;
      const jsonFilename = `${contents[contentIndex].id}.json`;
      
      // 기존 JSON 파일 삭제
      const { blobs } = await list({ prefix: `${folderPath}/`, limit: 100 });
        const existingFile: { pathname: string; url: string } | undefined = blobs.find((blob: { pathname: string; url: string }): boolean => 
          blob.pathname.endsWith('.json') && 
          blob.pathname.includes(contents[contentIndex].id)
        );
      
      if (existingFile) {
        await del(existingFile.url);
      }
      
      // 새 JSON 파일 생성
      const jsonBlob = await put(`${folderPath}/${jsonFilename}`, JSON.stringify(contents[contentIndex], null, 2), {
        access: 'public',
        contentType: 'application/json',
      });
(`✅ ${contents[contentIndex].type} 콘텐츠 Blob 업데이트 성공: ${jsonBlob.url}`);
    } catch (error) {
      console.error(`❌ ${contents[contentIndex].type} 콘텐츠 Blob 업데이트 실패:`, error);
    }

    return NextResponse.json(contents[contentIndex]);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    return NextResponse.json({ 
      error: '콘텐츠 업데이트에 실패했습니다.',
      details: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// DELETE: 콘텐츠 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: '콘텐츠 ID가 필요합니다.' }, { status: 400 });
    }

    // 모든 타입의 콘텐츠에서 해당 ID 찾기
    const types: ('appstory' | 'news' | 'memo' | 'memo2')[] = ['appstory', 'news', 'memo', 'memo2'];
    let deletedContent: ContentItem | null = null;
    let foundType: string | null = null;

    // 각 타입별 폴더에서 해당 ID의 콘텐츠 찾기
    for (const type of types) {
      try {
        const folderPath = `content-${type}`;
        const { blobs } = await list({ prefix: `${folderPath}/`, limit: 100 });
        const jsonFile: { pathname: string; url: string } | undefined = blobs.find((blob: { pathname: string; url: string }): boolean => 
          blob.pathname.endsWith('.json') && 
          blob.pathname.includes(id)
        );
        
        if (jsonFile) {
          const response = await fetch(jsonFile.url, { cache: 'no-store' });
          if (response.ok) {
            const data = await response.json();
            if (data.id === id) {
              deletedContent = data;
              foundType = type;
              break;
            }
          }
        }
      } catch (error) {
        console.warn(`[DELETE] ${type} 폴더에서 검색 실패:`, error);
      }
    }

    if (!deletedContent || !foundType) {
      return NextResponse.json({ error: '콘텐츠를 찾을 수 없습니다.' }, { status: 404 });
    }

    // 기존 방식: 로컬 파일에서도 삭제 (호환성 유지)
    try {
      const contents = await loadContents();
      const contentIndex = contents.findIndex(content => content.id === id);
      if (contentIndex !== -1) {
        contents.splice(contentIndex, 1);
        await saveContents(contents);
      }
    } catch (error) {
      console.warn('[DELETE] 로컬 파일 삭제 실패:', error);
    }

    // 개별 JSON 파일을 Vercel Blob에서 삭제
    try {
      const folderPath = `content-${foundType}`;
      const { blobs } = await list({ prefix: `${folderPath}/`, limit: 100 });
      const jsonFile: { pathname: string; url: string } | undefined = blobs.find((blob: { pathname: string; url: string }): boolean =>
        blob.pathname.endsWith('.json') && 
        blob.pathname.includes(id)
      );
      
      if (jsonFile) {
        await del(jsonFile.url);
(`✅ ${foundType} 콘텐츠 Blob 삭제 성공: ${id}`);
      }
    } catch (error) {
      console.error(`❌ ${foundType} 콘텐츠 Blob 삭제 실패:`, error);
    }

    return NextResponse.json({ message: '콘텐츠가 삭제되었습니다.' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    return NextResponse.json({ 
      error: '콘텐츠 삭제에 실패했습니다.',
      details: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
