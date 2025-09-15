import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const prefix = formData.get('prefix') as string || '';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // BLOB_READ_WRITE_TOKEN 확인
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        { error: 'BLOB_READ_WRITE_TOKEN environment variable is required' },
        { status: 500 }
      );
    }

    // 고유한 파일명 생성
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop();
    const fileName = `${prefix}_${timestamp}_${randomId}.${fileExtension}`;

    // Vercel Blob에 업로드
    const blob = await put(fileName, file, {
      access: 'public',
    });

    return NextResponse.json({ 
      success: true, 
      url: blob.url,
      fileName,
      size: file.size
    });

  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to upload file to Vercel Blob',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
