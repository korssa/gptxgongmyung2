// 번역 피드백 차단 함수
export const blockTranslationFeedback = () => {
  try {
    const feedbackElements = document.querySelectorAll([
      '.goog-te-balloon-frame',
      '.goog-te-ftab',
      '.goog-te-ftab-float',
      '.goog-tooltip',
      '.goog-tooltip-popup',
      '.goog-te-banner-frame',
      '.goog-te-banner-frame-skiptranslate',
      '.goog-te-gadget',
      '.goog-te-combo',
      '.goog-te-menu-frame',
      '.goog-te-menu-value',
      '.goog-te-banner',
      '.goog-te-banner-frame',
      '.goog-te-banner-frame-skiptranslate',
      '.goog-te-banner-frame-skiptranslate-goog-inline-block',
      '[class*="goog-te-balloon"]',
      '[class*="goog-te-ftab"]',
      '[class*="goog-te-tooltip"]',
      '[class*="goog-te-banner"]',
      '[class*="goog-te-gadget"]',
      '[class*="goog-te-combo"]',
      '[class*="goog-te-menu"]',
      '[id*="goog-te"]',
      '[id*="goog-tooltip"]',
      '[id*="goog-balloon"]'
    ].join(','));

    feedbackElements.forEach(el => {
      (el as HTMLElement).style.display = 'none';
      (el as HTMLElement).style.visibility = 'hidden';
      (el as HTMLElement).style.opacity = '0';
      (el as HTMLElement).style.pointerEvents = 'none';
      (el as HTMLElement).style.position = 'absolute';
      (el as HTMLElement).style.left = '-9999px';
      (el as HTMLElement).style.top = '-9999px';
      (el as HTMLElement).style.zIndex = '-9999';
    });
  } catch {
    // 에러 무시
  }
};

// 관리자 모드 버튼 클릭 핸들러 래퍼
export const createAdminButtonHandler = (handler: () => void) => {
  return () => {
    blockTranslationFeedback();
    handler();
  };
};

// 관리자 모드 버튼 이벤트 핸들러 래퍼
export const createAdminEventHandler = (handler: (event: React.MouseEvent) => void) => {
  return (event: React.MouseEvent) => {
    blockTranslationFeedback();
    handler(event);
  };
};

// 관리자 모드 폼 제출 핸들러 래퍼
export const createAdminFormHandler = (handler: (event: React.FormEvent) => void | Promise<void>) => {
  return async (event: React.FormEvent) => {
    blockTranslationFeedback();
    await handler(event);
  };
};
