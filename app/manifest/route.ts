import type { MetadataRoute } from 'next'

export async function GET(): Promise<Response> {
  const manifest: MetadataRoute.Manifest = {
    name: "Gongmyung's App Gallery",
    short_name: 'Gongmyung Apps',
    description: 'Gongmyung - We\'re just. that kind of group!',
    start_url: '/',
    display: 'standalone',
    background_color: '#000000',
    theme_color: '#fbbf24',
    orientation: 'portrait-primary',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any'
      },
      {
        src: '/logo.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any'
      }
    ],
    categories: ['productivity', 'utilities', 'entertainment'],
    lang: 'en',
    dir: 'ltr'
  }

  return new Response(JSON.stringify(manifest), {
    headers: {
      'Content-Type': 'application/manifest+json',
    },
  })
}
