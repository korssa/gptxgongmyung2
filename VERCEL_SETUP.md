# 🚀 Vercel 배포 가이드

## 📋 **사전 준비**

### 1. Vercel 계정 및 프로젝트 생성
1. [Vercel](https://vercel.com) 계정 생성
2. GitHub 저장소를 Vercel에 연결
3. 프로젝트 배포

### 2. Vercel Blob Storage 활성화
1. Vercel 대시보드 → 프로젝트 선택
2. `Storage` 탭 → `Create Database` 
3. `Blob` 선택 → 데이터베이스 생성
4. 생성된 Blob에서 `BLOB_READ_WRITE_TOKEN` 복사

## ⚙️ **환경 변수 설정 (중요!)**

### Vercel 대시보드에서 설정:
```bash
# Settings → Environment Variables

# 필수: Vercel Blob Storage 토큰
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxx

# 필수: 스토리지 타입 설정 (vercel-blob으로 설정)
STORAGE_TYPE=vercel-blob
NEXT_PUBLIC_STORAGE_TYPE=vercel-blob

# 선택사항: 도메인 설정
NEXT_PUBLIC_VERCEL_URL=your-app.vercel.app
```

### 🚨 **중요: 이미지 업로드 문제 해결**
Vercel 배포 후 이미지가 새로고침 시 사라지는 문제를 해결하려면:

1. **환경 변수 확인**:
   - `STORAGE_TYPE=vercel-blob` ✅
   - `NEXT_PUBLIC_STORAGE_TYPE=vercel-blob` ✅
   - `BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxx` ✅

2. **Vercel 대시보드에서 재배포**:
   - Settings → Environment Variables 저장 후
   - Deployments → Redeploy

3. **브라우저 개발자 도구 확인**:
   - Console에서 "🔧 Storage Type: vercel-blob" 메시지 확인
   - "☁️ Using Vercel Blob Storage" 메시지 확인

### 로컬 개발용 (.env.local):
```bash
# 로컬에서는 local 스토리지 사용
STORAGE_TYPE=local
NEXT_PUBLIC_STORAGE_TYPE=local

# 또는 Vercel Blob 테스트시
# BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxx
# STORAGE_TYPE=vercel-blob
# NEXT_PUBLIC_STORAGE_TYPE=vercel-blob
```

## 🔧 **배포 과정**

### 1. GitHub에 푸시
```bash
git add .
git commit -m "Add Vercel Blob Storage support"
git push origin main
```

### 2. Vercel 자동 배포
- GitHub 푸시시 자동으로 배포됨
- 빌드 로그에서 환경 변수 확인
- 배포 완료후 도메인 접속

### 3. 스토리지 테스트
1. 관리자 모드 로그인
2. 이미지 업로드 테스트
3. 브라우저 개발자 도구에서 업로드 URL 확인
   - 로컬: `/uploads/filename`
   - Vercel Blob: `https://xxx.blob.vercel-storage.com/filename`

## 🔍 **문제 해결**

### 이미지 업로드 후 새로고침 시 사라지는 문제:

#### 1. 환경 변수 확인
```bash
# Vercel 대시보드 → Settings → Environment Variables
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_xxxxxxxxx  # ✅ 필수
STORAGE_TYPE=vercel-blob                        # ✅ 필수
NEXT_PUBLIC_STORAGE_TYPE=vercel-blob            # ✅ 필수
```

#### 2. 브라우저 개발자 도구 확인
- F12 → Console 탭
- 이미지 업로드 시 다음 메시지들 확인:
  ```
  🔧 Storage Type: vercel-blob
  ☁️ Using Vercel Blob Storage
  ✅ Vercel Blob upload completed: https://xxx.blob.vercel-storage.com/xxx
  ```

#### 3. Vercel Blob Storage 상태 확인
- Vercel 대시보드 → Storage → Blob
- 업로드된 파일들이 표시되는지 확인

#### 4. 재배포 후 테스트
```bash
# 환경 변수 변경 후
# Vercel 대시보드 → Deployments → Redeploy
```

### 업로드 실패시:
1. `BLOB_READ_WRITE_TOKEN` 확인
2. Vercel 대시보드에서 Blob Storage 상태 확인
3. 환경 변수 `NEXT_PUBLIC_STORAGE_TYPE` 확인
4. 브라우저 개발자 도구에서 에러 로그 확인

### 이미지 로드 실패시:
1. 업로드된 파일의 URL 형식 확인
2. Vercel Blob의 `access: 'public'` 설정 확인
3. CORS 설정 확인

### 비용 관리:
1. Vercel 대시보드에서 사용량 모니터링
2. 불필요한 파일 정기적 삭제
3. 이미지 압축 고려

## 📊 **스토리지 비교**

| 특징 | 로컬 스토리지 | Vercel Blob |
|------|---------------|-------------|
| 영구성 | ❌ 재배포시 삭제 | ✅ 영구 보존 |
| 비용 | 무료 | 월 $0.15/GB |
| 속도 | 빠름 | 매우 빠름 (CDN) |
| 관리 | 수동 | 자동 |
| 확장성 | 제한적 | 무제한 |

## 🎯 **운영 모드별 설정**

### 개발 환경 (localhost):
```env
STORAGE_TYPE=local
NEXT_PUBLIC_STORAGE_TYPE=local
```

### 스테이징 환경:
```env
STORAGE_TYPE=vercel-blob
NEXT_PUBLIC_STORAGE_TYPE=vercel-blob
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_dev_xxx
```

### 프로덕션 환경:
```env
STORAGE_TYPE=vercel-blob
NEXT_PUBLIC_STORAGE_TYPE=vercel-blob
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_prod_xxx
```

## 📈 **모니터링**

### Vercel 대시보드에서 확인:
- Blob Storage 사용량
- 업로드/다운로드 트래픽
- API 호출 횟수
- 월간 비용

### 로그 확인:
```bash
# Vercel CLI로 로그 확인
vercel logs your-app

# 실시간 로그
vercel logs your-app --follow
```

## 🎉 **배포 완료!**

모든 설정이 완료되면:
- ✅ 이미지가 Vercel Blob에 영구 저장
- ✅ 전 세계 CDN으로 빠른 로딩
- ✅ 자동 백업 및 중복 제거
- ✅ 무제한 확장 가능
- ✅ 새로고침 후에도 이미지 유지
