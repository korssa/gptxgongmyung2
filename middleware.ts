import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // ✅ 무조건 공개해야 하는 경로들 - 인증 우회
  const PUBLIC_PATHS = [
    '/manifest.json',
    '/favicon.ico',
    '/robots.txt',
    '/sitemap.xml',
  ]
  
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/api/public') ||
    PUBLIC_PATHS.includes(pathname) ||
    /^\/icon(-\d+x\d+)?\.png$/.exec(pathname) ||     // icon.png, icon-192x192.png ...
    /^\/apple-icon(-\d+x\d+)?\.png$/.exec(pathname)  // apple-icon-180x180.png ...
  ) {
    return NextResponse.next()
  }

  // ... 나머지 기존 로직 (관리자 차단 등)
  return NextResponse.next()
}

export const config = {
  // 매처는 너무 넓히지 말고 기본은 전체, 위의 if로 우회
  matcher: ['/((?!_next/static|_next/image).*)'],
}
