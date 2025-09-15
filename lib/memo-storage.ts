// 메모(작성 폼) 로컬 캐시 유틸리티

export type MemoDraft = {
  title: string;
  content: string;
  author: string;
  tags?: string;
  isPublished?: boolean;
};

type MemoStorageShape = {
  drafts: Record<string, MemoDraft | undefined>; // key: type (e.g., 'memo', 'memo2', 'app-story', 'news')
};

const STORAGE_KEY = 'memo_storage';

export function loadMemoDraft(type: string): MemoDraft | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return undefined;
    const parsed: MemoStorageShape = JSON.parse(saved);
    return parsed?.drafts?.[type];
  } catch {
    return undefined;
  }
}

export function saveMemoDraft(type: string, draft: MemoDraft) {
  if (typeof window === 'undefined') return;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    const parsed: MemoStorageShape = saved ? JSON.parse(saved) : { drafts: {} };
    parsed.drafts = parsed.drafts || {};
    parsed.drafts[type] = draft;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    // ignore
  }
}

export function clearMemoDraft(type: string) {
  if (typeof window === 'undefined') return;
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    const parsed: MemoStorageShape = JSON.parse(saved);
    if (parsed?.drafts) {
      delete parsed.drafts[type];
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
    }
  } catch {
    // ignore
  }
}


