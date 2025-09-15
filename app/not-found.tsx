import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '페이지를 찾을 수 없습니다 - Gongmyung App Gallery',
  description: '요청하신 페이지를 찾을 수 없습니다. Gongmyung App Gallery로 돌아가서 다양한 앱들을 확인해보세요.',
  robots: {
    index: false,
    follow: true,
  },
}

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="text-center">
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-4">페이지를 찾을 수 없습니다</h2>
        <p className="text-gray-400 mb-8">
          요청하신 페이지가 존재하지 않거나 이동되었을 수 있습니다.
        </p>
        <Link 
          href="/"
          className="inline-block bg-amber-500 hover:bg-amber-600 text-black font-semibold py-3 px-6 rounded-lg transition-colors"
        >
          홈으로 돌아가기
        </Link>
      </div>
    </div>
  )
}
