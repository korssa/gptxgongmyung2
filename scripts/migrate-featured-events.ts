#!/usr/bin/env tsx

/**
 * 기존 featured-apps.json을 featured.json과 events.json으로 분리하는 마이그레이션 스크립트
 */

import { promises as fs } from 'fs';
import path from 'path';

const OLD_FEATURED_FILE = path.join(process.cwd(), 'data', 'featured-apps.json');
const NEW_FEATURED_FILE = path.join(process.cwd(), 'data', 'featured.json');
const NEW_EVENTS_FILE = path.join(process.cwd(), 'data', 'events.json');

async function migrateFeaturedEvents() {
  try {
    console.log('🔄 Featured/Events 마이그레이션 시작...');
    
    // 기존 파일 존재 확인
    try {
      await fs.access(OLD_FEATURED_FILE);
    } catch {
      console.log('❌ 기존 featured-apps.json 파일이 없습니다.');
      return;
    }
    
    // 기존 데이터 읽기
    const oldData = await fs.readFile(OLD_FEATURED_FILE, 'utf-8');
    const parsed = JSON.parse(oldData);
    
    console.log('📥 기존 데이터:', parsed);
    
    // 데이터 분리
    const featured = Array.isArray(parsed.featured) ? parsed.featured : [];
    const events = Array.isArray(parsed.events) ? parsed.events : [];
    
    console.log('📤 분리된 데이터:', { featured, events });
    
    // 디렉토리 생성
    const dataDir = path.dirname(NEW_FEATURED_FILE);
    await fs.mkdir(dataDir, { recursive: true });
    
    // 새로운 파일들 생성
    await fs.writeFile(NEW_FEATURED_FILE, JSON.stringify(featured, null, 2));
    await fs.writeFile(NEW_EVENTS_FILE, JSON.stringify(events, null, 2));
    
    console.log('✅ 마이그레이션 완료!');
    console.log(`📁 ${NEW_FEATURED_FILE} 생성됨 (${featured.length}개 항목)`);
    console.log(`📁 ${NEW_EVENTS_FILE} 생성됨 (${events.length}개 항목)`);
    
    // 기존 파일 백업
    const backupFile = OLD_FEATURED_FILE + '.backup';
    await fs.copyFile(OLD_FEATURED_FILE, backupFile);
    console.log(`💾 기존 파일 백업: ${backupFile}`);
    
    // 기존 파일 삭제
    await fs.unlink(OLD_FEATURED_FILE);
    console.log('🗑️ 기존 featured-apps.json 삭제됨');
    
  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error);
  }
}

// 스크립트 실행
if (require.main === module) {
  migrateFeaturedEvents();
}

export { migrateFeaturedEvents };
