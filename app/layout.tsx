import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./translatefeedback.css";
import { WebsiteSchema, OrganizationSchema } from "@/components/seo-schema";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap',
  preload: false,
  fallback: ['system-ui', 'arial'],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
  preload: false,
  fallback: ['monospace'],
});

export const metadata: Metadata = {
  title: "Gongmyung's App Gallery - Creative App Collection",
  description: "Discover a curated collection of innovative apps created by Gongmyung. Experience apps that harmoniously blend creativity and purpose.",
  keywords: "app gallery, mobile apps, app development, Gongmyung, app collection, innovative apps, app stories",
  authors: [{ name: "Gongmyung" }],
  creator: "Gongmyung",
  publisher: "Gongmyung",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://gongmyung.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: "Gongmyung's App Gallery - Creative App Collection",
    description: "Discover a curated collection of innovative apps created by Gongmyung. Experience apps that harmoniously blend creativity and purpose.",
    url: 'https://gongmyung.com',
    siteName: "Gongmyung's App Gallery",
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: "Gongmyung's App Gallery",
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Gongmyung's App Gallery - Creative App Collection",
    description: "Discover a curated collection of innovative apps created by Gongmyung. Experience apps that harmoniously blend creativity and purpose.",
    images: ['/logo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code', // Google Search Console에서 받은 코드로 교체
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: "Gongmyung's App Gallery",
  },

};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <WebsiteSchema />
        <OrganizationSchema />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning={true}
      >
        {children}
      </body>
    </html>
  );
}
