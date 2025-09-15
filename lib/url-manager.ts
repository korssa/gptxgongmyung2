/**
 * 안전한 URL 관리 시스템
 * removeChild 에러 방지를 위한 전역 URL 매니저
 */

class URLManager {
  private urls = new Set<string>();
  private disposed = false;

  /**
   * 안전하게 URL을 생성하고 관리에 추가
   */
  createObjectURL(file: File): string | null {
    if (this.disposed) {
      return null;
    }

    try {
      const url = URL.createObjectURL(file);
      this.urls.add(url);
      return url;
    } catch {
      return null;
    }
  }

  /**
   * 개별 URL을 안전하게 해제
   */
  revokeObjectURL(url: string): void {
    if (!url || this.disposed) return;

    try {
      URL.revokeObjectURL(url);
      this.urls.delete(url);
    } catch {
      // ignore revoke errors
    }
  }

  /**
   * 모든 URL을 안전하게 정리
   */
  dispose(): void {
    if (this.disposed) return;

    this.disposed = true;
    
    const urlsToRevoke = Array.from(this.urls);
    this.urls.clear();

    // 비동기로 정리하여 DOM 에러 방지
    setTimeout(() => {
      urlsToRevoke.forEach(url => {
        try {
          URL.revokeObjectURL(url);
        } catch {
          // 정리 시 에러 무시
        }
      });
    }, 0);
  }

  /**
   * 관리 중인 URL 개수 반환
   */
  getActiveURLCount(): number {
    return this.urls.size;
  }

  /**
   * 매니저 상태 확인
   */
  isDisposed(): boolean {
    return this.disposed;
  }
}

// 컴포넌트별 URL 매니저 팩토리
export function createURLManager(): URLManager {
  return new URLManager();
}

// 전역 정리 함수 (페이지 언로드 시)
const globalManagers = new Set<URLManager>();

export function registerManager(manager: URLManager): void {
  globalManagers.add(manager);
}

export function unregisterManager(manager: URLManager): void {
  globalManagers.delete(manager);
}

// 페이지 언로드 시 모든 매니저 정리
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    globalManagers.forEach(manager => {
      try {
        manager.dispose();
           } catch {
             // 페이지 언로드 시 에러 무시
      }
    });
    globalManagers.clear();
  });
}
