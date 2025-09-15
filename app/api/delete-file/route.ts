import { NextRequest, NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();

    if (!url) {
      return NextResponse.json(
        { error: 'No URL provided' },
        { status: 400 }
      );
    }

    // Vercel Blob Storage URL인 경우
    if (url.includes('vercel-storage.com') || url.includes('blob.vercel-storage.com')) {
      try {
        await del(url);
        return NextResponse.json({ success: true });
      } catch (error) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Failed to delete from Vercel Blob Storage',
            details: error instanceof Error ? error.message : String(error)
          },
          { status: 500 }
        );
      }
    }

    // 로컬 파일인 경우
    if (url.startsWith('/uploads/')) {
      try {
        const fileName = url.split('/').pop();
        if (!fileName) {
          return NextResponse.json(
            { error: 'Invalid file path' },
            { status: 400 }
          );
        }

        const filePath = path.join(process.cwd(), 'public', 'uploads', fileName);
        
        // 파일 존재 여부 확인
        try {
          await fs.access(filePath);
        } catch {
          return NextResponse.json(
            { error: 'File not found' },
            { status: 404 }
          );
        }

        // 파일 삭제
        await fs.unlink(filePath);
        return NextResponse.json({ success: true });

      } catch (error) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Failed to delete local file',
            details: error instanceof Error ? error.message : String(error)
          },
          { status: 500 }
        );
      }
    }

    // 외부 URL인 경우 (삭제 불가)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Cannot delete external URL',
        details: 'External URLs cannot be deleted through this API'
      },
      { status: 400 }
    );

  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to process delete request',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}
