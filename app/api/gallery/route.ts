import { NextRequest, NextResponse } from 'next/server';
import { list, put, del } from '@vercel/blob';

// 갤러리 아이템 타입
export interface GalleryItem {
  id: string;
  title: string;
  content: string;
  author: string;
  imageUrl?: string;
  publishDate: string;
  tags?: string[];
  isPublished: boolean;
  type: 'gallery' | 'featured' | 'events' | 'normal';
  store?: 'google-play' | 'app-store'; // 스토어 정보 추가
  storeUrl?: string; // 스토어 URL 추가
  appCategory?: 'normal' | 'featured' | 'events'; // 앱 카테고리 추가
  status?: 'published' | 'development' | 'in-review'; // 앱 상태 추가
  // AppItem과 호환성을 위한 추가 필드들
  name?: string; // title과 동일
  developer?: string; // author와 동일
  description?: string; // content와 동일
  iconUrl?: string; // imageUrl과 동일
  screenshotUrls?: string[]; // imageUrl을 배열로
  rating?: number;
  downloads?: string;
  version?: string;
  size?: string;
  category?: string;
  views?: number;
  likes?: number;
  uploadDate?: string; // publishDate와 동일
  isFeatured?: boolean;
  isEvent?: boolean;
  adminStoreUrl?: string;
}

// GET: 갤러리 아이템 목록 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'gallery' | 'featured' | 'events' | 'normal' | null;

    if (!type) {
      return NextResponse.json({ error: 'Type parameter is required' }, { status: 400 });
    }

    // Vercel Blob에서 해당 타입의 폴더 조회
    const folderPaths = new Set();
    if (type === 'gallery' || type === 'normal') {
      folderPaths.add('gallery-gallery');
      folderPaths.add('gallery-normal'); // 기존 데이터 호환성을 위해
    } else if (type === 'featured') {
      folderPaths.add('gallery-featured');
    } else if (type === 'events') {
      folderPaths.add('gallery-events');
    }
    
  const allBlobs = [] as Array<Awaited<ReturnType<typeof list>>['blobs'][number]>;
    for (const folderPath of folderPaths) {
      const { blobs } = await list({
        prefix: `${folderPath}/`,
      });
      allBlobs.push(...blobs);
    }

    // JSON 파일들만 필터링
    const jsonFiles = allBlobs.filter(blob => blob.pathname.endsWith('.json'));
    
  const items: GalleryItem[] = [];

    // 각 JSON 파일에서 데이터 로드
    for (const jsonFile of jsonFiles) {
      try {
        // 최신 파일을 가져오기 위해 캐시를 비활성화합니다.
        const response = await fetch(jsonFile.url, { cache: 'no-store' });
        if (response.ok) {
          const data = await response.json();
          const pushItem = (raw: unknown) => {
            const r = raw as Record<string, unknown>;
            if (!r || typeof r !== 'object') return;
            const id = typeof r.id === 'string' ? r.id : undefined;
            if (!id) return;

            const getStr = (k: string): string | undefined => (typeof r[k] === 'string' ? (r[k] as string) : undefined);
            const getArrStr = (k: string): string[] => (Array.isArray(r[k]) ? (r[k] as unknown[]).filter(x => typeof x === 'string') as string[] : []);

            const pickType = (): GalleryItem['type'] => {
              const t = getStr('type');
              if (t === 'gallery' || t === 'featured' || t === 'events' || t === 'normal') return t;
              return (type || 'gallery') as GalleryItem['type'];
            };

            const pickStatus = (): NonNullable<GalleryItem['status']> => {
              const s = getStr('status');
              if (s === 'published' || s === 'in-review' || s === 'development') return s;
              const isPublished = r['isPublished'] === true;
              return isPublished ? 'published' : 'development';
            };

            const pickStore = (): NonNullable<GalleryItem['store']> => {
              const s = getStr('store');
              return s === 'app-store' ? 'app-store' : 'google-play';
            };

            const firstImage = getStr('imageUrl') || getStr('iconUrl') || (getArrStr('screenshotUrls')[0]);
            const screenshots = getArrStr('screenshotUrls');

            const pickCategory = (): NonNullable<GalleryItem['appCategory']> => {
              const c = getStr('appCategory');
              if (c === 'featured' || c === 'events' || c === 'normal') return c;
              if (type === 'featured') return 'featured';
              if (type === 'events') return 'events';
              return 'normal';
            };

            const normalized: GalleryItem = {
              id,
              title: getStr('title') || getStr('name') || '',
              content: getStr('content') || getStr('description') || '',
              author: getStr('author') || getStr('developer') || '',
              imageUrl: firstImage,
              publishDate: getStr('publishDate') || getStr('uploadDate') || new Date().toISOString(),
              tags: getArrStr('tags'),
              isPublished: r['isPublished'] === true || pickStatus() === 'published',
              type: pickType(),
              store: pickStore(),
              storeUrl: getStr('storeUrl'),
              appCategory: pickCategory(),
              status: pickStatus(),
              name: getStr('name') || getStr('title') || '',
              developer: getStr('developer') || getStr('author') || '',
              description: getStr('description') || getStr('content') || '',
              iconUrl: getStr('iconUrl') || firstImage || '',
              screenshotUrls: screenshots.length > 0 ? screenshots : (firstImage ? [firstImage] : []),
              rating: typeof r['rating'] === 'number' ? (r['rating'] as number) : 4.5,
              downloads: getStr('downloads') || '1K+',
              version: getStr('version') || '1.0.0',
              size: getStr('size') || '50MB',
              category: getStr('category') || '',
              views: typeof r['views'] === 'number' ? (r['views'] as number) : 0,
              likes: typeof r['likes'] === 'number' ? (r['likes'] as number) : 0,
              uploadDate: getStr('uploadDate') || getStr('publishDate') || new Date().toISOString(),
              isFeatured: r['isFeatured'] === true,
              isEvent: r['isEvent'] === true,
              adminStoreUrl: getStr('adminStoreUrl'),
            };
            items.push(normalized);
          };

          if (Array.isArray(data)) {
            data.forEach(pushItem);
          } else if (data && (data as Record<string, unknown>).id) {
            pushItem(data);
          }
        }
      } catch (_error) {
        // ignore single file errors
      }
    }

    // 타입별 필터링
    let filteredItems: GalleryItem[];
    if (type === 'gallery' || type === 'normal') {
      // All apps에서는 review와 published 상태의 카드들을 모두 표시
      filteredItems = items.filter(item => 
        (item.isPublished || item.status === 'in-review' || item.status === 'published')
      );
    } else {
      // Featured와 Events는 발행된 아이템만 반환
      filteredItems = items.filter(item => 
        item.isPublished
      );
    }
    // 최신순 정렬 (uploadDate/publishDate 기준)
    filteredItems.sort((a, b) => {
      const ad = new Date(a.uploadDate || a.publishDate || 0).getTime();
      const bd = new Date(b.uploadDate || b.publishDate || 0).getTime();
      return bd - ad;
    });

    return NextResponse.json(filteredItems, {
      headers: {
        'Cache-Control': 'no-store, no-cache, max-age=0, must-revalidate',
      },
    });

  } catch (error) {
    return NextResponse.json({ error: '갤러리 조회 실패' }, { status: 500 });
  }
}

// POST: 갤러리 아이템 생성/업데이트
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'gallery' | 'featured' | 'events' | 'normal' | null;


    if (!type) {
      return NextResponse.json({ error: 'Type parameter is required' }, { status: 400 });
    }

    const contentType = request.headers.get('content-type');
    let galleryItem: GalleryItem;

    if (contentType?.includes('application/json')) {
      // JSON 데이터 처리 (타입 변경 시 사용)
      const body = await request.json();
      const { item } = body;
      
      if (!item || !item.id) {
        return NextResponse.json({ error: 'Item data and ID are required' }, { status: 400 });
      }

      galleryItem = {
        ...item,
        type, // URL 파라미터의 타입으로 강제 설정
      };
    } else {
      // FormData 처리 (기존 업로드 방식)
      const formData = await request.formData();
      const title = formData.get('title') as string;
      const content = formData.get('content') as string;
      const author = formData.get('author') as string;
      const tags = formData.get('tags') as string;
      const isPublished = formData.get('isPublished') === 'true';
      const status = formData.get('status') as 'published' | 'development' | 'in-review' | null;
      const store = formData.get('store') as 'google-play' | 'app-store' | null;
      const storeUrl = formData.get('storeUrl') as string | null;
      const appCategory = formData.get('appCategory') as string | null;
      const file = formData.get('file') as File | null;

      if (!title || !content || !author) {
        return NextResponse.json({ error: '필수 필드가 누락되었습니다' }, { status: 400 });
      }

      // 고유 ID 생성
      const id = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      let imageUrl: string | undefined;

      // 이미지 업로드 - type에 따라 경로 결정
      if (file) {
        const filename = `${id}.${file.name.split('.').pop()}`;
        // type이 gallery 또는 normal이면 gallery-gallery 폴더에, 아니면 gallery-{type} 폴더에 저장
        const imageFolder = (type === 'gallery' || type === 'normal') ? 'gallery-gallery' : `gallery-${type}`;
        const blob = await put(`${imageFolder}/${filename}`, file, {
          access: 'public',
        });
        imageUrl = blob.url;
      }

      // 갤러리 아이템 생성
      galleryItem = {
        id,
        title,
        content,
        author,
        imageUrl,
        publishDate: new Date().toISOString(),
        tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
        isPublished,
        status: status || (isPublished ? 'published' : 'development'), // status가 없으면 isPublished에 따라 설정
        type,
        store: store || 'google-play', // 기본값으로 구글플레이 설정
        storeUrl: storeUrl || undefined,
        appCategory: (appCategory as 'normal' | 'featured' | 'events') || 'normal', // 기본값으로 normal 설정
        // AppItem과 호환성을 위한 필드들
        name: title,
        developer: author,
        description: content,
        iconUrl: imageUrl,
        screenshotUrls: imageUrl ? [imageUrl] : [],
        rating: 4.5,
        downloads: "1K+",
        version: "1.0.0",
        size: "50MB",
        category: "",
        views: 0,
        likes: 0,
        uploadDate: new Date().toISOString(),
        isFeatured: appCategory === 'featured',
        isEvent: appCategory === 'events',
        adminStoreUrl: undefined,
      };
    }

    // JSON 파일로 저장 - type에 따라 경로 결정
    const jsonFilename = `${galleryItem.id}.json`;
    // type이 gallery 또는 normal이면 gallery-gallery 폴더에, 아니면 gallery-{type} 폴더에 저장
    const jsonFolder = (type === 'gallery' || type === 'normal') ? 'gallery-gallery' : `gallery-${type}`;
    const jsonBlob = await put(`${jsonFolder}/${jsonFilename}`, JSON.stringify(galleryItem, null, 2), {
      access: 'public',
      contentType: 'application/json',
    });

    return NextResponse.json({ 
      success: true, 
      item: galleryItem,
      jsonUrl: jsonBlob.url 
    });

  } catch (error) {
    return NextResponse.json({ error: '갤러리 생성 실패' }, { status: 500 });
  }
}

// PUT: 갤러리 아이템 편집
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'gallery' | 'featured' | 'events' | 'normal' | null;

    if (!type) {
      return NextResponse.json({ error: 'Type parameter is required' }, { status: 400 });
    }

    const body = await request.json();
    const { item } = body;

    if (!item || !item.id) {
      return NextResponse.json({ error: 'Item data and ID are required' }, { status: 400 });
    }

    // Vercel Blob에서 해당 타입의 폴더 조회
    // type별로 해당하는 폴더만 조회 (appCategory별 분리)
    const folderPaths = new Set();
    if (type === 'gallery' || type === 'normal') {
      folderPaths.add('gallery-gallery');
      folderPaths.add('gallery-normal'); // 기존 데이터 호환성을 위해
    } else if (type === 'featured') {
      folderPaths.add('gallery-featured');
    } else if (type === 'events') {
      folderPaths.add('gallery-events');
    }
    
    const allBlobs = [];
    for (const folderPath of folderPaths) {
      const { blobs } = await list({
        prefix: `${folderPath}/`,
      });
      allBlobs.push(...blobs);
    }

    // 해당 ID의 JSON 파일 찾기 (정확한 파일만)
    const existingFile = allBlobs.find(blob => 
      blob.pathname.endsWith('.json') && 
      blob.pathname.includes(`/${item.id}.json`)
    );

    if (!existingFile) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // 기존 JSON 파일 삭제
    await del(existingFile.url);

    // 새 JSON 파일 생성 - type에 따라 경로 결정
    const jsonFilename = `${item.id}.json`;
    // type이 gallery면 gallery-gallery 폴더에, 아니면 gallery-{type} 폴더에 저장
    const jsonFolder = type === 'gallery' ? 'gallery-gallery' : `gallery-${type}`;
    const jsonBlob = await put(`${jsonFolder}/${jsonFilename}`, JSON.stringify(item, null, 2), {
      access: 'public',
      contentType: 'application/json',
    });

    return NextResponse.json({ 
      success: true, 
      item: item,
      jsonUrl: jsonBlob.url,
      message: 'Item updated successfully'
    });

  } catch (error) {
    return NextResponse.json({ error: '갤러리 편집 실패' }, { status: 500 });
  }
}

// DELETE: 갤러리 아이템 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') as 'gallery' | 'featured' | 'events' | 'normal' | null;
    const id = searchParams.get('id');

    if (!type || !id) {
      return NextResponse.json({ error: 'Type and ID parameters are required' }, { status: 400 });
    }

    // Vercel Blob에서 해당 타입의 폴더 조회
    // type별로 해당하는 폴더만 조회 (appCategory별 분리)
    const folderPaths = new Set();
    if (type === 'gallery' || type === 'normal') {
      folderPaths.add('gallery-gallery');
      folderPaths.add('gallery-normal'); // 기존 데이터 호환성을 위해
    } else if (type === 'featured') {
      folderPaths.add('gallery-featured');
    } else if (type === 'events') {
      folderPaths.add('gallery-events');
    }
    
    const allBlobs = [];
    for (const folderPath of folderPaths) {
      const { blobs } = await list({
        prefix: `${folderPath}/`,
      });
      allBlobs.push(...blobs);
    }

    // 해당 ID의 JSON 파일 찾기 (정확한 파일만)
    const jsonFile = allBlobs.find(blob => 
      blob.pathname.endsWith('.json') && 
      blob.pathname.includes(`/${id}.json`)
    );

    if (!jsonFile) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // JSON 파일 삭제
    await del(jsonFile.url);

    // 이미지 파일도 삭제 (있는 경우) - 같은 폴더에서만
    const imageFile = allBlobs.find(blob => 
      blob.pathname.includes(`/${id}.`) && 
      !blob.pathname.endsWith('.json')
    );

    if (imageFile) {
      await del(imageFile.url);
    }

    return NextResponse.json({ success: true, message: 'Item deleted successfully' });

  } catch (error) {
    return NextResponse.json({ error: '갤러리 삭제 실패' }, { status: 500 });
  }
}
