export type AppStore = "google-play" | "app-store";

export type AppStatus = "published" | "in-review" | "development";

export interface AppItem {
  id: string;
  name: string;
  developer: string;
  description: string;
  iconUrl: string;
  screenshotUrls: string[];
  store: AppStore;
  status: AppStatus;
  rating: number;
  downloads: string;
  views: number;
  likes: number;
  uploadDate: string;
  tags?: string[];
  storeUrl?: string;
  version?: string;
  size?: string;
  category?: string;
  type?: 'gallery'; // 갤러리 앱 타입 구분을 위한 속성
  isFeatured?: boolean; // Featured 앱 여부
  isEvent?: boolean; // Event 앱 여부
  adminStoreUrl?: string; // 관리자 전용 스토어 URL (Events 앱용)
  appCategory?: 'featured' | 'events' | 'normal'; // 앱 카테고리 분류
}

export interface AppFormData {
  name: string;
  developer: string;
  description: string;
  store: AppStore;
  status: AppStatus;
  tags: string;
  rating: number;
  downloads: string;
  version: string;
  size: string;
  category: string;
  storeUrl: string;
  appCategory?: 'featured' | 'events' | 'normal'; // 새 카드 생성 시 분류
}

export type FilterType = "all" | "latest" | "featured" | "events" | "normal";

export interface FilterOptions {
  type: FilterType;
  searchQuery?: string;
}

// App Story, News, Memo를 위한 새로운 타입들
export type ContentType = "appstory" | "news" | "memo" | "memo2";

export interface ContentItem {
  id: string;
  title: string;
  content: string;
  author: string;
  publishDate: string;
  type: ContentType;
  imageUrl?: string;
  tags?: string[];
  isPublished: boolean;
}

export interface ContentFormData {
  title: string;
  content: string;
  author: string;
  type: ContentType;
  tags: string;
  isPublished: boolean;
}
