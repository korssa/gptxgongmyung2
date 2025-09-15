import { AppItem, ContentItem } from '@/types';

/**
 * Vercel Blob Storage에서 앱 데이터 로드
 */
export async function loadAppsFromBlob(): Promise<AppItem[]> {
  try {
    const response = await fetch('/api/data/apps');
    if (!response.ok) {
      // Failed to load apps from blob
      return [];
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('❌ [loadAppsFromBlob] 기존 Blob API 오류:', error);
    // Error loading apps from blob
    return [];
  }
}

/**
 * Vercel Blob Storage에서 콘텐츠 데이터 로드
 */
export async function loadContentsFromBlob(): Promise<ContentItem[]> {
  try {
    const response = await fetch('/api/data/contents');
    if (!response.ok) {
      // Failed to load contents from blob
      return [];
    }
    return await response.json();
  } catch (error) {
    // Error loading contents from blob
    return [];
  }
}

/**
 * Vercel Blob Storage에 앱 데이터 저장
 */
export async function saveAppsToBlob(apps: AppItem[]): Promise<boolean> {
  try {
    const response = await fetch('/api/data/apps', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(apps),
    });
    
    if (!response.ok) {
      // Failed to save apps to blob
      return false;
    }
    
    return true;
  } catch (error) {
    // Error saving apps to blob
    return false;
  }
}

/**
 * Vercel Blob Storage에 콘텐츠 데이터 저장
 */
export async function saveContentsToBlob(contents: ContentItem[]): Promise<boolean> {
  try {
    const response = await fetch('/api/data/contents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(contents),
    });
    
    if (!response.ok) {
      // Failed to save contents to blob
      return false;
    }
    
    return true;
  } catch (error) {
    // Error saving contents to blob
    return false;
  }
}

/**
 * 타입별로 콘텐츠를 분리해서 저장
 */
export async function saveContentsByTypeToBlob(type: 'appstory' | 'news' | 'memo', contents: ContentItem[]): Promise<boolean> {
  try {
    const response = await fetch(`/api/content/type?type=${type}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(contents),
    });
    
    if (!response.ok) {
      // Failed to save type contents to blob
      return false;
    }
    
    return true;
  } catch (error) {
    // Error saving type contents to blob
    return false;
  }
}

/**
 * 타입별로 콘텐츠를 분리해서 로드
 */
export async function loadContentsByTypeFromBlob(type: 'appstory' | 'news' | 'memo'): Promise<ContentItem[]> {
  try {
    const response = await fetch(`/api/content/type?type=${type}`);
    if (!response.ok) {
      // Failed to load type contents from blob
      return [];
    }
    
    const data = await response.json();
    return data.contents || [];
  } catch (error) {
    // Error loading type contents from blob
    return [];
  }
}

/**
 * 타입별로 갤러리 앱을 분리해서 로드
 */
export async function loadAppsByTypeFromBlob(type: 'gallery'): Promise<AppItem[]> {
  try {
    // 타입별 API가 실패하면 기존 API로 폴백
    const response = await fetch(`/api/apps/type?type=${type}`);
    if (!response.ok) {
      // Failed to load type apps from blob, fallback to existing API
      return await loadAppsFromBlob();
    }
    
    const data = await response.json();
    const typeApps = data.apps || [];
    
    // 타입별 API에서 앱이 없으면 기존 API로 폴백
    if (typeApps.length === 0) {
      return await loadAppsFromBlob();
    }
    
    return typeApps;
  } catch (error) {
    // Error loading type apps from blob, fallback to existing API
    return await loadAppsFromBlob();
  }
}

/**
 * 타입별로 갤러리 앱을 분리해서 저장 (featured/events 상태 반영)
 */
export async function saveAppsByTypeToBlob(type: 'gallery', apps: AppItem[], featuredIds?: string[], eventIds?: string[]): Promise<{ success: boolean; data?: AppItem[] }> {
  try {
    // featured/events 상태를 앱 데이터에 반영
    let appsWithFlags = apps;
    if (featuredIds && eventIds) {
      const featuredSet = new Set(featuredIds);
      const eventSet = new Set(eventIds);
      
      appsWithFlags = apps.map(app => ({
        ...app,
        isFeatured: featuredSet.has(app.id),
        isEvent: eventSet.has(app.id)
      }));
      
      console.log('🔄 갤러리 앱에 featured/events 플래그 반영:', {
        total: appsWithFlags.length,
        featured: appsWithFlags.filter(app => app.isFeatured).length,
        events: appsWithFlags.filter(app => app.isEvent).length
      });
    }
    
    const response = await fetch(`/api/apps/type?type=${type}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ apps: appsWithFlags }),
    });
    
    if (!response.ok) {
      return { success: false };
    }
    
    const result = await response.json();
    return { 
      success: true, 
      data: result.data || appsWithFlags // API 응답에서 최종 데이터 반환
    };
  } catch (error) {
    return { success: false };
  }
}

/**
 * Featured/Events 앱 정보를 Blob에서 로드 (메모장 방식과 동일)
 */
export async function loadFeaturedAppsFromBlob(): Promise<{ featured: string[]; events: string[] }> {
  try {
    const response = await fetch('/api/apps/featured', {
      method: 'GET',
      cache: 'no-store',
    });
    if (!response.ok) return { featured: [], events: [] };
    const data = await response.json();
    return {
      featured: Array.isArray(data.featured) ? data.featured : [],
      events: Array.isArray(data.events) ? data.events : [],
    };
  } catch {
    return { featured: [], events: [] };
  }
}

/**
 * Featured/Events 앱 정보를 Blob에 저장
 */
export async function saveFeaturedAppsToBlob(featured: string[], events: string[]): Promise<boolean> {
  try {
    console.log('📤 saveFeaturedAppsToBlob 호출:', { featured, events });
    const response = await fetch('/api/apps/featured', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ featured, events }),
      cache: 'no-store',
    });
    console.log('📤 saveFeaturedAppsToBlob 응답:', { ok: response.ok, status: response.status });
    return response.ok;
  } catch (error) {
    console.error('❌ saveFeaturedAppsToBlob 오류:', error);
    return false;
  }
}

/**
 * 특정 앱의 Featured/Events 상태를 토글
 */
export async function toggleFeaturedAppStatus(
  appId: string,
  type: 'featured' | 'events',
  action: 'add' | 'remove'
): Promise<{ featured: string[]; events: string[] } | null> {
  try {
    console.log(`[Client] toggleFeaturedAppStatus 호출: ${appId} ${type} ${action}`);
    const response = await fetch('/api/apps/featured', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appId, type, action }),
      cache: 'no-store',
    });
    console.log(`[Client] toggleFeaturedAppStatus 응답:`, { ok: response.ok, status: response.status });
    if (!response.ok) return null;
    const data = await response.json();
    console.log(`[Client] toggleFeaturedAppStatus 데이터:`, data);
    return {
      featured: Array.isArray(data.featured) ? data.featured : [],
      events: Array.isArray(data.events) ? data.events : [],
    };
  } catch (error) {
    console.error(`[Client] toggleFeaturedAppStatus 오류:`, error);
    return null;
  }
}

// ===== 새로운 분리된 함수들 =====

/**
 * Featured 앱 ID 목록만 로드
 */
export async function loadFeaturedIds(): Promise<string[]> {
  try {
    const res = await fetch('/api/data/featured', { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('❌ [loadFeaturedIds] 오류:', error);
    return [];
  }
}

/**
 * Events 앱 ID 목록만 로드
 */
export async function loadEventIds(): Promise<string[]> {
  try {
    const res = await fetch('/api/data/events', { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('❌ [loadEventIds] 오류:', error);
    return [];
  }
}

/**
 * Featured 앱 ID 목록만 저장
 */
export async function saveFeaturedIds(ids: string[]): Promise<{ success: boolean; data?: string[] }> {
  try {
    console.log('📤 saveFeaturedIds 호출:', ids);
    const res = await fetch('/api/data/featured', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ids),
    });
    console.log('📤 saveFeaturedIds 응답:', { ok: res.ok, status: res.status });
    
    if (!res.ok) {
      return { success: false };
    }
    
    const result = await res.json();
    return { 
      success: true, 
      data: result.data || ids // API 응답에서 최종 데이터 반환
    };
  } catch (error) {
    console.error('❌ saveFeaturedIds 오류:', error);
    return { success: false };
  }
}

/**
 * Events 앱 ID 목록만 저장
 */
export async function saveEventIds(ids: string[]): Promise<{ success: boolean; data?: string[] }> {
  try {
    console.log('📤 saveEventIds 호출:', ids);
    const res = await fetch('/api/data/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ids),
    });
    console.log('📤 saveEventIds 응답:', { ok: res.ok, status: res.status });
    
    if (!res.ok) {
      return { success: false };
    }
    
    const result = await res.json();
    return { 
      success: true, 
      data: result.data || ids // API 응답에서 최종 데이터 반환
    };
  } catch (error) {
    console.error('❌ saveEventIds 오류:', error);
    return { success: false };
  }
}