export const translations = {
  en: {
    // Header
    siteName: "GongMyung Gallery",
    search: "Search apps...",
    upload: "Upload",
    all: "All",
    latest: "Latest",
    popular: "Popular",
    
    // Tabs
    googlePlay: "Google Play Store",
    appStore: "App Store",
    
    // App Card
    downloads: "downloads",
    rating: "rating",
    views: "views",
    uploadDate: "Uploaded",
    author: "Developer",
    
    // Categories
    published: "Published",
    inReview: "In Review",
    development: "In Development",
    
    // Upload Dialog
    uploadTitle: "Upload App",
    uploadDescription: "Add a new app to the gallery.",
    appName: "App Name",
    appNamePlaceholder: "Enter app name",
    developer: "Developer",
    developerPlaceholder: "Enter developer name",
    description: "Description",
    descriptionPlaceholder: "Enter app description",
    category: "Category",
    tags: "Tags (Optional)",
    tagsPlaceholder: "Enter tags separated by commas",
    tagsExample: "e.g., productivity, utility, game",
    selectFiles: "Click to upload or drag and drop",
    fileTypes: "PNG, JPG, JPEG (Max 10MB)",
    selectedFiles: "Selected files:",
    cancel: "Cancel",
    
    // Admin
    adminPassword: "Admin Password",
    passwordPlaceholder: "Enter admin password",
    login: "Login",
    logout: "Logout",
    adminPanel: "Admin Panel",
    
    // Footer
    footerDescription: "Explore amazing mobile APPS — with love, just for you.",
    explore: "Explore",
    community: "Community",
    account: "Account",
    allApps: "All Apps",
    featuredApps: "Featured Apps",
    newReleases: "New Releases",
    categories: "Categories",
    aboutDeveloper: "About Developer",
    events: "Events",
    announcements: "Announcements",
    support: "Support",
    signIn: "Sign In",
    signUp: "Sign Up",
    myApps: "My Apps",
    settings: "Settings",
    copyright: "© 2025 gongmyung.com. All rights reserved.",
    
    // Footer Sections
    exhibition: "Exhibition",
    forYou: "For You",
    seeEverything: "See everything we've made",
    justLaunched: "Just launched",
    recommendedPicks: "Recommended picks",
    discountsViaEmail: "Discounts via email",
    appStory: "App Story",
    howItWasMade: "How it was made",
    
    // Messages
    noAppsYet: "No apps yet",
    firstAppMessage: "Upload your first app to get started!",
    
    // Buttons
    like: "Like",
    download: "Download",
    share: "Share",
    more: "More",
    viewOnStore: "View on Store",
    
    // Petition
    petitionTitle: "Online Petition to Support Continued Use of chatGPT 4o (Legacy)",
    petitionDescription: "Support the continued availability of ChatGPT 4o Legacy version"
  },
  ko: {
    // Header
    siteName: "공명갤러리",
    search: "앱 검색...",
    upload: "업로드",
    all: "전체",
    latest: "최신",
    popular: "인기",
    
    // Tabs
    googlePlay: "구글 플레이스토어",
    appStore: "앱스토어",
    
    // App Card
    downloads: "다운로드",
    rating: "평점",
    views: "조회",
    uploadDate: "업로드",
    author: "개발자",
    
    // Categories
    published: "출시됨",
    inReview: "심사중",
    development: "개발중",
    
    // Upload Dialog
    uploadTitle: "앱 업로드",
    uploadDescription: "갤러리에 새로운 앱을 추가해보세요.",
    appName: "앱 이름",
    appNamePlaceholder: "앱 이름을 입력하세요",
    developer: "개발자",
    developerPlaceholder: "개발자명을 입력하세요",
    description: "설명",
    descriptionPlaceholder: "앱 설명을 입력하세요",
    category: "카테고리",
    tags: "태그 (선택사항)",
    tagsPlaceholder: "태그를 쉼표로 구분하여 입력하세요",
    tagsExample: "예: 생산성, 유틸리티, 게임",
    selectFiles: "클릭하여 업로드 또는 드래그 앤 드롭",
    fileTypes: "PNG, JPG, JPEG (최대 10MB)",
    selectedFiles: "선택된 파일:",
    cancel: "취소",
    
    // Admin
    adminPassword: "관리자 비밀번호",
    passwordPlaceholder: "관리자 비밀번호를 입력하세요",
    login: "로그인",
    logout: "로그아웃",
    adminPanel: "관리자 패널",
    
    // Footer
    footerDescription: "사랑으로 만든 놀라운 모바일 앱들을 탐험해보세요",
    explore: "탐색",
    community: "커뮤니티",
    account: "계정",
    allApps: "전체 앱",
    featuredApps: "추천 앱",
    newReleases: "신규 출시",
    categories: "카테고리",
    aboutDeveloper: "개발자 소개",
    events: "이벤트",
    announcements: "공지사항",
    support: "고객지원",
    signIn: "로그인",
    signUp: "회원가입",
    myApps: "내 앱",
    settings: "설정",
    copyright: "© 2025 gongmyung.com. 모든 권리 보유.",
    
    // Footer Sections
    exhibition: "전시회",
    forYou: "당신을 위해",
    seeEverything: "우리가 만든 모든 것을 보세요",
    justLaunched: "방금 출시됨",
    recommendedPicks: "추천 선택",
    discountsViaEmail: "이메일 할인",
    appStory: "앱 스토리",
    howItWasMade: "어떻게 만들어졌는지",
    
    // Messages
    noAppsYet: "아직 앱이 없습니다",
    firstAppMessage: "첫 번째 앱을 업로드해보세요!",
    
    // Buttons
    like: "좋아요",
    download: "다운로드",
    share: "공유",
    more: "더보기",
    viewOnStore: "스토어에서 보기",
    
    // Petition
    petitionTitle: "chatGPT 4o (Legacy) 지속 사용 지원 온라인 청원",
    petitionDescription: "ChatGPT 4o Legacy 버전의 지속적인 사용 가능성을 지원합니다"
  }
} as const;

export const languageNames = {
  en: "English",
  ko: "한국어"
} as const;

export type Language = keyof typeof translations;
export type TranslationKey = keyof typeof translations.en;
