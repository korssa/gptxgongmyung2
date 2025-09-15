import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// 로컬 이미지 저장 경로
const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'content-images');

// 업로드 디렉토리 생성
async function ensureUploadDir() {
  try {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  } catch {
    // 오류 세부 정보는 로깅하지 않음 (production)
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: '파일이 필요합니다.' }, { status: 400 });
    }

    // 파일 타입 검증
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: '이미지 파일만 업로드 가능합니다.' }, { status: 400 });
    }

    // 파일 크기 제한 (10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: '파일 크기는 10MB 이하여야 합니다.' }, { status: 400 });
    }

    // 업로드 디렉토리 생성
    await ensureUploadDir();

    // 고유한 파일명 생성
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = file.name.split('.').pop();
    const filename = `${timestamp}-${randomString}.${extension}`;
    const filePath = path.join(UPLOAD_DIR, filename);

    // 파일을 로컬에 저장
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await fs.writeFile(filePath, buffer);

    // 웹에서 접근 가능한 URL 반환
    const url = `/uploads/content-images/${filename}`;

    return NextResponse.json({
      url: url,
      filename: filename,
    });

  } catch {
    // 오류 세부 정보는 로깅하지 않음 (production)
    return NextResponse.json({ error: '이미지 업로드에 실패했습니다.' }, { status: 500 });
  }
}
