/**
 * 이미지 URL이 유효한지 검증
 */
export const isValidImageUrl = (url: string): boolean => {
  if (!url) return false;

  // HTTPS/HTTP URL 검증
  if (url.startsWith('https://') || url.startsWith('http://')) {
    return true;
  }

  // Vercel Blob Storage URL 검증
  if (url.includes('vercel-storage.com') || url.includes('blob.vercel-storage.com')) {
    return true;
  }

  // 로컬 업로드 경로 검증 (개발환경에서만 유효)
  if (url.startsWith('/uploads/')) {
    if (typeof window !== 'undefined' && 
        (window.location.hostname === 'localhost' || 
         window.location.hostname === '127.0.0.1')) {
      return true;
    }
    return false;
  }

  // Object URL 검증 (blob:)
  if (url.startsWith('blob:')) {
    return false;
  }

  return false;
};

/**
 * 이미지 URL을 검증하고 필요시 placeholder로 교체
 */
export const validateImageUrl = async (url: string, fallbackUrl?: string): Promise<string> => {
  const isValid = await isValidImageUrl(url);
  
  if (isValid) {
    return url;
  }
  
  if (fallbackUrl) {
    return fallbackUrl;
  }
  
  return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0zNSA0MEw1MCA1NUw2NSA0MEg3NVY2MEg2NUw1MCA3NUwzNSA2MEgyNVY0MEgzNVoiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+';
};

/**
 * 앱 객체의 모든 이미지 URL을 검증하고 수정
 */
export const validateAppImages = async <T extends { iconUrl: string; screenshotUrls: string[] }>(
  app: T
): Promise<T> => {
  const validatedIconUrl = await validateImageUrl(app.iconUrl);
  
  const validatedScreenshotUrls = await Promise.all(
    app.screenshotUrls.map((url, index) => {
      return validateImageUrl(url);
    })
  );
  
  const result = {
    ...app,
    iconUrl: validatedIconUrl,
    screenshotUrls: validatedScreenshotUrls
  };
  
  return result;
};

/**
 * 앱 배열의 모든 이미지 URL을 검증하고 수정
 */
export const validateAppsImages = async <T extends { iconUrl: string; screenshotUrls: string[] }>(
  apps: T[]
): Promise<T[]> => {
  const validatedApps = await Promise.all(
    apps.map(app => validateAppImages(app))
  );
  
  return validatedApps;
};
