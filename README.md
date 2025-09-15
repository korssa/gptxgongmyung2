# Gongmyung App Gallery

A modern app gallery built with Next.js, featuring app management, content creation, and interactive features.

## Features

### 🎨 App Gallery
- Grid and list view modes
- Search and filter functionality
- Admin mode for app management
- Featured apps and events system
- New releases showcase

### 📝 Content Management
- **App Story**: Share the development process and behind-the-scenes stories
- **News**: Publish company updates and announcements
- Rich text editor with markdown support
- Image upload with Vercel Blob storage
- Draft and publish system

### 🎉 Interactive Features
- Events system with email integration
- Contact forms with SMTP support
- Google Translate integration
- Responsive design for all devices

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Environment Variables

Create a `.env.local` file with the following variables:

```env
# Storage Type (local | vercel-blob)
STORAGE_TYPE=local

# Vercel Blob Storage (only needed if STORAGE_TYPE=vercel-blob)
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token

# SMTP Configuration (Gmail)
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password

# Development
NEXT_PUBLIC_VERCEL_URL=localhost:3000
```

### Local Development Setup

For local development, the app uses local file storage by default:

- **Content Data**: Stored in `data/contents.json`
- **Uploaded Images**: Stored in `public/uploads/content-images/`
- **App Images**: Stored in `public/uploads/` (icons and screenshots)

The app will automatically create these directories when needed.

## Content Management

### App Story
- Click "App Story" in the footer to access the content management interface
- Write about your app development journey
- Add images and tags
- Save as draft or publish immediately

### News
- Click "News" in the footer to manage company announcements
- Share updates and important information
- Rich formatting with markdown support

## Admin Features

- **Password**: Click the copyright text to access admin mode
- **App Management**: Upload, edit, and delete apps
- **Content Management**: Create and manage stories and news
- **Featured Apps**: Mark apps as featured with the heart icon
- **Events**: Designate apps for special events with the star icon

## Technology Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS with ShadCN UI
- **Storage**: Vercel Blob for file storage
- **Email**: Nodemailer with SMTP
- **Translation**: Google Translate Widget
- **Icons**: Lucide React

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

## Deploy on Vercel

### 🚀 **Vercel 배포 가이드**

1. **Vercel 계정 생성 및 GitHub 연결**
   - [Vercel](https://vercel.com) 계정 생성
   - GitHub 저장소 `korssa/gongzu` 연결
   - 자동 배포 설정

2. **Vercel Blob Storage 설정**
   - Vercel 대시보드 → Storage → Create Database → Blob
   - `BLOB_READ_WRITE_TOKEN` 복사

3. **환경 변수 설정**
   ```bash
   # Vercel 대시보드 → Settings → Environment Variables
   BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxx
   STORAGE_TYPE=vercel-blob
   NEXT_PUBLIC_STORAGE_TYPE=vercel-blob
   ```

4. **배포 완료**
   - GitHub 푸시 시 자동 배포
   - 관리자 모드에서 이미지 업로드 테스트

자세한 배포 가이드는 [VERCEL_SETUP.md](./VERCEL_SETUP.md)를 참고하세요.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
