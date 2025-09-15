/**
 * Select 컴포넌트 보호 유틸리티
 * Google Translate 위젯과의 충돌 방지
 */

export function preventTranslateFeedback(): void {
  // 즉시 실행 및 지연 실행으로 이중 보호
  const hideFeedback = () => {
    try {
      const feedbackSelectors = [
        '.goog-te-balloon-frame',
        '.goog-te-ftab',
        '.goog-te-ftab-float', 
        '.goog-tooltip',
        '.goog-tooltip-popup',
        '.goog-te-banner-frame',
        '.goog-te-spinner-pos',
        '[class*="goog-te-balloon"]:not(.goog-te-combo):not(.goog-te-gadget):not(.goog-te-menu2):not(.goog-te-menu-frame)',
        '[class*="goog-te-ftab"]:not(.goog-te-combo):not(.goog-te-gadget):not(.goog-te-menu2):not(.goog-te-menu-frame)',
        '[class*="goog-te-tooltip"]:not(.goog-te-combo):not(.goog-te-gadget):not(.goog-te-menu2):not(.goog-te-menu-frame)'
      ];
      
      feedbackSelectors.forEach(selector => {
        try {
          document.querySelectorAll(selector).forEach(el => {
            const element = el as HTMLElement;
            if (element && document.contains(element)) {
              element.style.display = 'none';
              element.style.visibility = 'hidden';
              element.style.opacity = '0';
              element.style.pointerEvents = 'none';
              element.style.position = 'fixed';
              element.style.top = '-9999px';
              element.style.left = '-9999px';
            }
          });
        } catch (selectorError) {
          // 개별 선택자 에러 무시
        }
      });
    } catch (error) {
      // 전체 함수 에러 무시
    }
  };

  // 즉시 실행
  hideFeedback();
  
  // 지연 실행 (DOM 업데이트 후)
  setTimeout(hideFeedback, 50);
  setTimeout(hideFeedback, 100);
  setTimeout(hideFeedback, 200);
}

/**
 * Select 컴포넌트를 Google Translate로부터 보호 (기능 유지)
 */
export function protectSelectFromTranslate(element: HTMLElement | null): void {
  if (!element) return;

  try {
    // 번역 방지 속성만 추가 (기능은 유지)
    element.setAttribute('translate', 'no');
    element.classList.add('notranslate');
    
    // 자식 요소들에도 번역 방지만 적용
    const selectElements = element.querySelectorAll([
      'select',
      '[role="combobox"]',
      '[role="listbox"]',
      '[role="option"]',
      '[data-radix-select-content]',
      '[data-radix-select-item]',
      '[data-radix-select-trigger]',
      '[data-radix-select-viewport]'
    ].join(','));
    
    selectElements.forEach(el => {
      const selectEl = el as HTMLElement;
      selectEl.setAttribute('translate', 'no');
      selectEl.classList.add('notranslate');
      
      // 클릭 가능성 보장
      selectEl.style.pointerEvents = 'auto';
      selectEl.style.userSelect = 'auto';
      selectEl.style.cursor = 'pointer';
    });
    
  } catch (error) {
    // 보호 실패 시 에러 무시
  }
}

/**
 * Select 값 변경 시 안전한 핸들러
 */
export function createSafeSelectHandler<T>(
  originalHandler: (value: T) => void
): (value: T) => void {
  return (value: T) => {
    // 원본 핸들러 실행
    originalHandler(value);
    
    // 피드백 차단
    preventTranslateFeedback();
    
    // 추가 보호를 위한 DOM 강화
    setTimeout(() => {
      try {
        // Select 관련 요소들 재보호
        document.querySelectorAll('.notranslate').forEach(el => {
          protectSelectFromTranslate(el as HTMLElement);
        });
      } catch (error) {
        // 재보호 실패 무시
      }
    }, 100);
  };
}
