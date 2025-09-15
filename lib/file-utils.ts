export const saveFileToLocal = async (file: File, prefix: string = ""): Promise<string> => {
  try {
    // 환경변수 확인
    const storageType = process.env.NEXT_PUBLIC_STORAGE_TYPE || 
                       process.env.STORAGE_TYPE || 
                       'local';

    // Vercel 환경에서 Vercel Blob Storage 사용
    const isVercelEnvironment = typeof window !== 'undefined' && 
      (window.location.hostname.includes('vercel.app') || 
       window.location.hostname.includes('vercel-storage.com'));

    const finalStorageType = isVercelEnvironment ? 'vercel-blob' : storageType;

    if (finalStorageType === 'vercel-blob') {
      // Vercel Blob Storage 직접 업로드
      const { uploadFile } = await import('./storage-adapter');
      const url = await uploadFile(file, prefix);
      return url;
    } else {
      // 로컬 업로드 (개발환경에서만)
      const formData = new FormData();
      formData.append('file', file);
      formData.append('prefix', prefix);
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      }).catch(err => {
        throw err;
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Local upload failed: ${response.statusText} - ${errorText}`);
      }
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Local upload failed');
      }
      
      return result.url;
    }
    
  } catch {
    // 클라이언트 사이드에서 더 정확한 환경 체크
    const isDevelopment = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || 
       window.location.hostname === '127.0.0.1');

    if (isDevelopment) {
      const objectUrl = URL.createObjectURL(file);
      setTimeout(() => {
        try {
          URL.revokeObjectURL(objectUrl);
        } catch {
          // 에러 무시
        }
      }, 60000);
      return objectUrl;
    } else {
      throw new Error("Upload failed, and fallback is disabled in production.");
    }
  }
};

export const deleteLocalFile = async (url: string): Promise<boolean> => {
  try {
    // 파일 삭제 시작

    // Vercel Blob URL인 경우
    if (url.includes('vercel-storage.com') || url.includes('blob.vercel-storage.com')) {
      // Vercel Blob 파일 삭제
      const { deleteFile } = await import('./storage-adapter');
      return await deleteFile(url);
    }
    
    // /uploads/ 경로로 시작하는 로컬 서버 파일인 경우
    if (url.startsWith('/uploads/')) {
      // 로컬 서버 파일 삭제
      
      const response = await fetch('/api/delete-file', {
        method: 'DELETE',
        body: JSON.stringify({ url }),
        headers: { 'Content-Type': 'application/json' },
      });
      
      const result = response.ok;
      // 로컬 파일 삭제 완료/실패
      return result;
    }
    
    // Object URL인 경우 (blob: 로 시작)
    if (url.startsWith('blob:')) {
      // Object URL 해제
      URL.revokeObjectURL(url);
      return true;
    }
    
    // 외부 URL인 경우 (삭제 불가)
    // 외부 URL은 삭제할 수 없음
    return true; // 성공으로 처리 (실제로는 삭제할 필요 없음)
    
  } catch {
    // 파일 삭제 실패
    return false;
  }
};

export const generateUniqueId = (): string => {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
};
