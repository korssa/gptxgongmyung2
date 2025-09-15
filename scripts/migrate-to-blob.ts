import fs from 'fs';
import path from 'path';
import { saveAppsToBlob, saveContentsToBlob } from '../lib/data-loader';

async function migrateToBlob() {
  try {
    
    // 로컬 JSON 파일 읽기
    const appsPath = path.join(process.cwd(), 'data', 'apps.json');
    const contentsPath = path.join(process.cwd(), 'data', 'contents.json');
    
    let apps = [];
    let contents = [];
    
    if (fs.existsSync(appsPath)) {
      const appsData = fs.readFileSync(appsPath, 'utf8');
      apps = JSON.parse(appsData);
    }
    
    if (fs.existsSync(contentsPath)) {
      const contentsData = fs.readFileSync(contentsPath, 'utf8');
      contents = JSON.parse(contentsData);
    }
    
    // Vercel Blob Storage에 저장
    if (apps.length > 0) {
      const appsSuccess = await saveAppsToBlob(apps);
    }
    
    if (contents.length > 0) {
      const contentsSuccess = await saveContentsToBlob(contents);
    }
    
  } catch (error) {
    console.error('❌ 마이그레이션 중 오류 발생:', error);
  }
}

// 스크립트 실행
migrateToBlob();
