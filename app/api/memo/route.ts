import { NextRequest, NextResponse } from 'next/server';
import { ContentItem, ContentFormData } from '@/types';
import { promises as fs } from 'fs';
import path from 'path';
import { list, put, del } from '@vercel/blob';

// 메모 전용 파일 경로
const MEMO_FILE_PATH = path.join(process.cwd(), 'data', 'memo.json');

// 데이터 디렉토리 생성 및 파일 초기화
async function ensureMemoFile() {
  try {
    const dataDir = path.dirname(MEMO_FILE_PATH);
    await fs.mkdir(dataDir, { recursive: true });
    
    // 파일이 없으면 빈 배열로 초기화
    try {
      await fs.access(MEMO_FILE_PATH);
    } catch {
      await fs.writeFile(MEMO_FILE_PATH, JSON.stringify([]));
    }
  } catch {
    // 에러 무시
  }
}

// Vercel Blob에서 메모 콘텐츠 로드
async function loadMemoContentsFromBlob(): Promise<ContentItem[]> {
  try {
    const folderPath = 'content-memo';
    const { blobs } = await list({ prefix: `${folderPath}/`, limit: 100 });
    
    const contents: ContentItem[] = [];
    
    for (const blob of blobs) {
      if (blob.pathname.endsWith('.json')) {
        try {
          const response = await fetch(blob.url, { cache: 'no-store' });
          if (response.ok) {
            const data = await response.json();
            contents.push(data);
          }
        } catch (error) {
          console.warn(`[loadMemoContentsFromBlob] JSON 파일 로드 실패: ${blob.pathname}`, error);
        }
      }
    }
    
    return contents;
  } catch (error) {
    console.error('[loadMemoContentsFromBlob] Blob 로드 실패:', error);
    return [];
  }
}

// 메모 콘텐츠 로드 (하이브리드)
async function loadMemoContents(): Promise<ContentItem[]> {
  try {
    // Vercel 환경에서는 Blob에서 로드
    if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
      const blobContents = await loadMemoContentsFromBlob();
      if (blobContents.length > 0) {
        return blobContents;
      }
      // Blob에 데이터가 없으면 메모리 저장소 사용
      return memoMemoryStorage;
    }
    
    // 로컬 환경에서는 파일에서 로드
    await ensureMemoFile();
    const data = await fs.readFile(MEMO_FILE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

// 메모 전용 메모리 저장소
let memoMemoryStorage: ContentItem[] = [];

// 메모 콘텐츠 저장
async function saveMemoContents(contents: ContentItem[]) {
  try {
    // Vercel 환경에서는 메모리 저장소 사용
    if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
      memoMemoryStorage = [...contents];
      return;
    }
    
    // 로컬 환경에서는 파일 저장
    await ensureMemoFile();
    const jsonData = JSON.stringify(contents, null, 2);
    await fs.writeFile(MEMO_FILE_PATH, jsonData);
  } catch (error) {
    throw new Error(`메모 저장 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
  }
}

// GET: 메모 콘텐츠 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const published = searchParams.get('published');
    
    let contents: ContentItem[] = [];
    try {
      contents = await loadMemoContents();
    } catch {
      contents = [];
    }

    // 게시된 콘텐츠만 필터링
    if (published === 'true') {
      contents = contents.filter(content => content.isPublished);
    }

    // 최신순 정렬
    contents.sort((a, b) => new Date(b.publishDate).getTime() - new Date(a.publishDate).getTime());

    return NextResponse.json(contents);
  } catch {
    return NextResponse.json({ error: '메모 조회에 실패했습니다.' }, { status: 500 });
  }
}

// POST: 새 메모 생성
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
    
    const contents = await loadMemoContents();
    
    // 메모 전용 ID 범위: 20000-29999
    const baseId = 20000;
    const maxId = 29999;
    
    // 기존 ID와 겹치지 않는 고유 ID 생성
    let id: string;
    let attempts = 0;
    const maxAttempts = 100;
    
    do {
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
      type: 'memo', // 항상 memo 타입으로 설정
      tags: body.tags ? body.tags.split(',').map(tag => tag.trim()).filter(Boolean) : [],
      isPublished: body.isPublished || false,
      imageUrl: body.imageUrl,
    };

    contents.push(newContent);
    await saveMemoContents(contents);

    // Vercel Blob에 개별 JSON 파일로 저장
    try {
      const jsonFilename = `${newContent.id}.json`;
      const jsonBlob = await put(`content-memo/${jsonFilename}`, JSON.stringify(newContent, null, 2), {
        access: 'public',
        contentType: 'application/json',
      });
(`✅ 메모 Blob 저장 성공: ${newContent.id}`);
    } catch (error) {
      console.error(`❌ 메모 Blob 저장 실패: ${newContent.id}`, error);
    }

    return NextResponse.json(newContent, { status: 201 });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    return NextResponse.json({ 
      error: '메모 생성에 실패했습니다.',
      details: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// PUT: 메모 업데이트
export async function PUT(request: NextRequest) {
  try {
    const body: { id: string } & Partial<ContentFormData> & { imageUrl?: string } = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json({ error: '메모 ID는 필수입니다.' }, { status: 400 });
    }

    // 필수 필드 검증
    if (updateData.title !== undefined && !updateData.title.trim()) {
      return NextResponse.json({ error: '제목은 필수입니다.' }, { status: 400 });
    }
    if (updateData.author !== undefined && !updateData.author.trim()) {
      return NextResponse.json({ error: '작성자는 필수입니다.' }, { status: 400 });
    }
    if (updateData.content !== undefined && !updateData.content.trim()) {
      return NextResponse.json({ error: '내용은 필수입니다.' }, { status: 400 });
    }

    const contents = await loadMemoContents();
    const contentIndex = contents.findIndex(content => content.id === id);
    
    if (contentIndex === -1) {
      return NextResponse.json({ error: '메모를 찾을 수 없습니다.' }, { status: 404 });
    }

    contents[contentIndex] = {
      ...contents[contentIndex],
      ...updateData,
      title: updateData.title?.trim() ?? contents[contentIndex].title,
      author: updateData.author?.trim() ?? contents[contentIndex].author,
      content: updateData.content?.trim() ?? contents[contentIndex].content,
      tags: updateData.tags ? updateData.tags.split(',').map(tag => tag.trim()).filter(Boolean) : contents[contentIndex].tags,
    };

    await saveMemoContents(contents);

    // Vercel Blob에서 기존 JSON 파일 삭제 후 새로 저장
    try {
      const folderPath = 'content-memo';
      const { blobs } = await list({ prefix: `${folderPath}/`, limit: 100 });
      const existingFile: { pathname: string; url: string } | undefined = blobs.find((blob: { pathname: string; url: string }): boolean => 
        blob.pathname.endsWith('.json') && 
        blob.pathname.includes(contents[contentIndex].id)
      );
      
      if (existingFile) {
        await del(existingFile.url);
      }
      
      const jsonFilename = `${contents[contentIndex].id}.json`;
      const jsonBlob = await put(`content-memo/${jsonFilename}`, JSON.stringify(contents[contentIndex], null, 2), {
        access: 'public',
        contentType: 'application/json',
      });
(`✅ 메모 Blob 업데이트 성공: ${contents[contentIndex].id}`);
    } catch (error) {
      console.error(`❌ 메모 Blob 업데이트 실패: ${contents[contentIndex].id}`, error);
    }

    return NextResponse.json(contents[contentIndex]);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    return NextResponse.json({ 
      error: '메모 업데이트에 실패했습니다.',
      details: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

// DELETE: 메모 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: '메모 ID가 필요합니다.' }, { status: 400 });
    }

    const contents = await loadMemoContents();
    const contentIndex = contents.findIndex(content => content.id === id);
    
    if (contentIndex === -1) {
      return NextResponse.json({ error: '메모를 찾을 수 없습니다.' }, { status: 404 });
    }

    const deletedContent = contents[contentIndex];
    contents.splice(contentIndex, 1);
    await saveMemoContents(contents);

    // Vercel Blob에서 개별 JSON 파일 삭제
    try {
      const folderPath = 'content-memo';
      const { blobs } = await list({ prefix: `${folderPath}/`, limit: 100 });
      const jsonFile: { pathname: string; url: string } | undefined = blobs.find((blob: { pathname: string; url: string }): boolean =>
        blob.pathname.endsWith('.json') && 
        blob.pathname.includes(id)
      );
      
      if (jsonFile) {
        await del(jsonFile.url);
(`✅ 메모 Blob 삭제 성공: ${id}`);
      }
    } catch (error) {
      console.error(`❌ 메모 Blob 삭제 실패: ${id}`, error);
    }

    return NextResponse.json({ message: '메모가 삭제되었습니다.' });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    return NextResponse.json({ 
      error: '메모 삭제에 실패했습니다.',
      details: errorMessage,
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
