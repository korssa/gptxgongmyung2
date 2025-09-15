import { put, del, head } from '@vercel/blob';

/**
 * Vercel Blob Storage 어댑터
 */

/**
 * Vercel Blob 환경 변수 확인
 */
/**
 * Vercel Blob 토큰 검색: 우선적으로 BLOB_READ_WRITE_TOKEN을 찾고,
 * 없다면 배포 과정에서 다른 키명으로 설정한 (예: vercel_blob_rw_... ) 값을 찾아 반환합니다.
 * (토큰 값 자체는 로그에 찍지 않습니다.)
 */
const findVercelBlobToken = (): string | undefined => {
  if (process.env.BLOB_READ_WRITE_TOKEN) return process.env.BLOB_READ_WRITE_TOKEN;

  if (process.env.VERCEL_BLOB_READ_WRITE_TOKEN) return process.env.VERCEL_BLOB_READ_WRITE_TOKEN;

  // 탐색: 환경변수 키 중에 vercel_blob_rw_ 로 시작하는 키가 있으면 사용
  for (const k of Object.keys(process.env)) {
    if (!k) continue;
    const lk = k.toLowerCase();
    if (lk.startsWith('vercel_blob_rw_') || lk.includes('vercel_blob_rw_')) {
      // 값은 민감하므로 반환만 하고 로그에는 직접 출력하지 않습니다.
      return process.env[k];
    }
  }

  return undefined;
};

const checkVercelBlobConfig = () => {
  const token = findVercelBlobToken();
  if (!token) {
    throw new Error('BLOB_READ_WRITE_TOKEN environment variable is required for Vercel Blob Storage');
  }
  return token;
};

/**
 * 파일을 Vercel Blob에 업로드
 */
export const uploadToVercelBlob = async (file: File, prefix: string = ""): Promise<string> => {
  try {
    // 서버 측에서만 직접 Vercel Blob SDK를 사용하도록 토큰 존재 검사
    checkVercelBlobConfig();

    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop();
    const fileName = `${prefix}_${timestamp}_${randomId}.${fileExtension}`;
    
    const blob = await put(fileName, file, {
      access: 'public',
    });

    return blob.url;

  } catch (err) {
    throw new Error(`Vercel Blob upload failed: ${String(err)}`);
  }
};

/**
 * Vercel Blob에서 파일 삭제
 */
export const deleteFromVercelBlob = async (url: string): Promise<boolean> => {
  try {
    checkVercelBlobConfig();

    const urlObj = new URL(url);
    const fileName = urlObj.pathname.split('/').pop();

    if (!fileName) {
      throw new Error('Invalid blob URL');
    }

    await del(url);

    return true;

  } catch (error) {
    return false;
  }
};

/**
 * Vercel Blob 파일 존재 확인
 */
export const checkVercelBlobExists = async (url: string): Promise<boolean> => {
  try {
    const response = await head(url);
    return !!response;
  } catch {
    return false;
  }
};

/**
 * 스토리지 타입에 따른 통합 업로드 함수
 */
export const uploadFile = async (file: File, prefix: string = ""): Promise<string> => {
  // 환경변수 우선순위: NEXT_PUBLIC_STORAGE_TYPE > STORAGE_TYPE > 기본값
  const storageType = process.env.NEXT_PUBLIC_STORAGE_TYPE || 
                     process.env.STORAGE_TYPE || 
                     'local';

  // Vercel 환경에서 Vercel Blob Storage 사용
  const isVercelEnvironment = typeof window !== 'undefined' && 
    (window.location.hostname.includes('vercel.app') || 
     window.location.hostname.includes('vercel-storage.com') ||
     window.location.hostname.includes('gongmyung.com'));

  // 강제 로컬 업로드 플래그: 배포 환경에서 로컬(public/uploads)에 파일을 저장하고
  // 수동으로 레포지토리에 커밋/리디플로이하려는 경우 사용합니다.
  // 설정 방법: NEXT_PUBLIC_FORCE_LOCAL_UPLOAD=1 (빌드/배포 환경 변수)
  const forceLocal = (process.env.NEXT_PUBLIC_FORCE_LOCAL_UPLOAD === '1') || (process.env.FORCE_LOCAL_UPLOAD === '1');

  let finalStorageType = storageType;
  
  // Vercel 환경이거나 환경변수가 vercel-blob으로 설정된 경우 강제로 Vercel Blob 사용
  if ((isVercelEnvironment && !forceLocal) || storageType === 'vercel-blob') {
    finalStorageType = 'vercel-blob';
  } else if (forceLocal) {
    finalStorageType = 'local';
  }

  if (finalStorageType === 'vercel-blob') {
    // 브라우저(클라이언트) 환경에서는 비밀 토큰을 노출하지 않도록
    // 서버 API에 파일을 전달하고 서버에서 Vercel Blob에 업로드하도록 위임합니다.
    if (typeof window !== 'undefined') {
      const formData = new FormData();
  // File 타입은 브라우저 환경에서 실제 File/Blob입니다. 명시적 캐스팅으로 lint 경고 제거
  formData.append('file', file as Blob);
      formData.append('prefix', prefix);

      const res = await fetch('/api/blob/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new Error(`Server upload failed: ${res.status} ${res.statusText} - ${text}`);
      }

      const json = await res.json();
      if (!json || !json.url) {
        throw new Error(json?.error || 'Server upload returned no URL');
      }

      return json.url;
    }

    // 서버(서버 컴퓨트) 환경이면 직접 SDK 사용
    return uploadToVercelBlob(file, prefix);
  } else {
    return uploadToLocal(file, prefix);
  }
};

/**
 * 스토리지 타입에 따른 통합 삭제 함수
 */
export const deleteFile = async (url: string): Promise<boolean> => {
  try {
    
    // Vercel Blob Storage URL인 경우
    if (url.includes('vercel-storage.com') || url.includes('blob.vercel-storage.com')) {
      return await deleteFromVercelBlob(url);
    }
    
    // 로컬 업로드 파일인 경우
    if (url.startsWith('/uploads/')) {
      return await deleteFromLocal(url);
    }
    
    // 외부 URL인 경우 (삭제 불가)
    return true; // 성공으로 처리
  } catch (error) {
    return false;
  }
};

/**
 * 로컬 저장소 업로드
 */
const uploadToLocal = async (file: File, prefix: string = ""): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('prefix', prefix);

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Local upload failed: ${response.statusText}`);
  }

  const result = await response.json();
  if (!result.success) {
    throw new Error(result.error || 'Local upload failed');
  }

  return result.url;
};

/**
 * 로컬 저장소 삭제
 */
const deleteFromLocal = async (url: string): Promise<boolean> => {
  const response = await fetch('/api/delete-file', {
    method: 'DELETE',
    body: JSON.stringify({ url }),
    headers: { 'Content-Type': 'application/json' },
  });

  return response.ok;
};
