# 📧 SMTP 설정 가이드 (Gmail)

## 1. Gmail 2단계 인증 활성화

1. [Google 계정 설정](https://myaccount.google.com/)에 접속
2. **보안** 탭 클릭
3. **2단계 인증** 활성화

## 2. 앱 비밀번호 생성

1. **보안** 탭에서 **앱 비밀번호** 클릭
2. **앱 선택** → **기타 (맞춤 이름)** 선택
3. 이름 입력 (예: "gongmyung-app")
4. **생성** 버튼 클릭
5. 생성된 16자리 비밀번호 복사

## 3. 환경 변수 설정

### 로컬 개발 (.env.local)
```env
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_16_digit_app_password
```

### Vercel 배포
1. Vercel 대시보드 → 프로젝트 선택
2. **Settings** → **Environment Variables**
3. 다음 변수 추가:
   - `SMTP_USER`: your_email@gmail.com
   - `SMTP_PASS`: your_16_digit_app_password

## 4. 테스트

1. 개발 서버 실행: `npm run dev`
2. Events, Feedback, Contact 버튼 클릭
3. 폼 작성 후 전송
4. Gmail에서 수신 확인

## 5. 다른 이메일 서비스 사용

### Outlook/Hotmail
```javascript
const transporter = nodemailer.createTransporter({
  service: 'outlook',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});
```

### Naver
```javascript
const transporter = nodemailer.createTransporter({
  host: 'smtp.naver.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});
```

## 6. 보안 주의사항

- ✅ 앱 비밀번호 사용 (일반 비밀번호 X)
- ✅ 환경 변수에 저장 (코드에 직접 입력 X)
- ✅ .env.local 파일을 .gitignore에 추가
- ✅ Vercel 환경 변수는 암호화되어 저장

## 7. 문제 해결

### "Invalid login" 오류
- 2단계 인증이 활성화되었는지 확인
- 앱 비밀번호를 정확히 입력했는지 확인

### "Less secure app access" 오류
- Gmail에서 "보안 수준이 낮은 앱의 액세스" 허용
- 또는 앱 비밀번호 사용 (권장)

### 메일이 스팸으로 분류되는 경우
- SPF, DKIM, DMARC 레코드 설정
- 발신자 도메인 인증
