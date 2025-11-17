# Supabase Phone Authentication 설정 완료 가이드

이 문서는 문(Moon) 프로젝트의 전화번호 인증 기능을 활성화하기 위한 Supabase 설정 가이드입니다.

## ✅ 사전 확인 완료 항목

- ✅ `users.phone` 컬럼 존재 (unique 제약조건 포함)
- ✅ 환경 변수 설정 완료 (.env.local)
- ✅ 인증 API 코드 구현 완료
- ✅ 회원가입 UI 컴포넌트 구현 완료

---

## 📝 Supabase Dashboard 설정 체크리스트

### 1️⃣ Phone Provider 활성화

- [ ] Supabase Dashboard 접속: https://supabase.com
- [ ] 프로젝트 선택: `xgnnhfmpporixibxpeas`
- [ ] Authentication → Providers 이동
- [ ] "Phone" 섹션에서 "Enable Phone Sign-up" 토글 ON

---

### 2️⃣ SMS Provider 설정 (Twilio 권장)

#### Twilio 계정 생성
- [ ] https://www.twilio.com 접속 및 회원가입
- [ ] 전화번호 인증 완료
- [ ] 무료 크레딧 $15 확인

#### Twilio 정보 수집
- [ ] Account SID 복사 (Console → Account Info)
- [ ] Auth Token 복사
- [ ] Messaging Service 생성:
  - [ ] Messaging → Services → Create Messaging Service
  - [ ] Service Name: "Moon SMS"
  - [ ] Use Case: "Notify my users"
  - [ ] Sender Pool에 전화번호 추가
  - [ ] Service SID 복사 (MG...)

#### Supabase에 Twilio 정보 입력
- [ ] SMS Provider: **Twilio** 선택
- [ ] Twilio Account SID 입력
- [ ] Twilio Auth Token 입력
- [ ] Twilio Message Service SID 입력
- [ ] Save 클릭

---

### 3️⃣ Rate Limiting 설정

- [ ] Authentication → Settings → Rate Limits
- [ ] SMS OTP 발송 제한 설정:
  ```
  per_second: 1
  per_hour: 5
  per_day: 20
  ```
- [ ] SMS OTP 검증 제한 설정:
  ```
  per_second: 5
  per_hour: 50
  ```

---

### 4️⃣ OTP 유효 시간 설정

- [ ] Authentication → Settings → Auth Configuration
- [ ] OTP Expiry: **180초** (3분) 설정
- [ ] Save

---

### 5️⃣ CAPTCHA 설정 (선택, 권장)

#### Google reCAPTCHA 생성
- [ ] https://www.google.com/recaptcha/admin 접속
- [ ] reCAPTCHA v2 "I'm not a robot" 선택
- [ ] 도메인 추가:
  - localhost
  - vercel.app 도메인
  - 커스텀 도메인 (있는 경우)
- [ ] Site Key 복사
- [ ] Secret Key 복사

#### Supabase에 reCAPTCHA 정보 입력
- [ ] Authentication → Settings → Security
- [ ] Enable reCAPTCHA: ON
- [ ] reCAPTCHA Site Key 입력
- [ ] reCAPTCHA Secret Key 입력
- [ ] Save

---

### 6️⃣ 테스트 전화번호 인증 (Twilio 무료 계정 사용 시)

Twilio 무료 계정은 검증된 번호로만 SMS 발송 가능합니다.

- [ ] Twilio Console → Phone Numbers → Verified Caller IDs
- [ ] "Add a new Caller ID" 클릭
- [ ] 본인 전화번호 입력 (국제 형식: +821012345678)
- [ ] SMS로 받은 인증 코드 입력
- [ ] 인증 완료

---

## 🧪 테스트 절차

### 로컬 개발 환경 테스트

1. **개발 서버 실행**
   ```bash
   npm run dev
   ```

2. **회원가입 페이지 접속**
   ```
   http://localhost:5173/sign-up
   ```

3. **전화번호 인증 테스트**
   - 검증된 전화번호 입력 (Twilio Verified Caller ID에 등록한 번호)
   - "인증번호" 버튼 클릭
   - SMS로 받은 6자리 코드 입력
   - 인증 완료 확인

4. **회원가입 완료**
   - 나머지 정보 입력
   - 회원가입 완료 후 로그인 확인

---

## 🔍 트러블슈팅

### 1. SMS가 발송되지 않음

**원인:**
- Twilio 계정이 Trial 상태
- 전화번호가 Verified Caller ID에 등록되지 않음

**해결:**
```
Twilio Console → Verified Caller IDs에서 테스트할 번호 인증
```

---

### 2. "Invalid phone number" 에러

**원인:**
- 전화번호 형식이 국제 형식이 아님

**해결:**
- 코드에서 `api.auth.format_to_international()` 사용 확인
- 예: 010-1234-5678 → +821012345678

---

### 3. "Rate limit exceeded" 에러

**원인:**
- OTP 요청이 너무 많음 (60초 내 재시도)

**해결:**
- 카운트다운 타이머 종료 후 재시도
- Supabase Rate Limit 설정 확인

---

### 4. OTP 검증 실패

**원인:**
- OTP 만료 (3분 초과)
- 잘못된 코드 입력

**해결:**
- 새로운 OTP 재전송
- 복사/붙여넣기로 정확한 코드 입력

---

## 💰 비용 안내

### Twilio 무료 크레딧 ($15)

- SMS 발송 비용 (미국): $0.0079/건
- SMS 발송 비용 (한국): $0.045/건
- 무료 크레딧으로 약 333건(한국 기준) 발송 가능

### 프로덕션 배포 시

- Twilio 계정 업그레이드 필요 (신용카드 등록)
- 월 사용량에 따라 과금
- 예상 비용: 100명 가입 시 약 $4.5

---

## 📚 참고 자료

- [Supabase Phone Login 공식 문서](https://supabase.com/docs/guides/auth/phone-login)
- [Twilio Messaging Services 가이드](https://www.twilio.com/docs/messaging/services)
- [Twilio 한국 SMS 발송 가이드](https://www.twilio.com/docs/messaging/guides/how-to-send-sms-messages-in-korea)

---

## ✅ 설정 완료 후 확인 사항

- [ ] `/sign-up` 페이지에서 전화번호 인증 작동
- [ ] SMS 수신 확인
- [ ] OTP 검증 성공
- [ ] 회원가입 완료 후 users 테이블에 phone 저장 확인
- [ ] 중복 전화번호 체크 작동 확인

---

## 🚀 다음 단계

1. **프로덕션 배포 전**
   - Twilio 계정 업그레이드 (신용카드 등록)
   - Rate Limiting 재검토
   - CAPTCHA 활성화 필수

2. **모니터링 설정**
   - Twilio Console에서 SMS 발송 로그 확인
   - Supabase Dashboard에서 Auth 로그 확인
   - 에러율 모니터링

3. **비용 최적화**
   - 불필요한 재전송 방지
   - Rate Limiting 강화
   - CAPTCHA로 Bot 방지

---

**설정 완료 시간: 약 30분 ~ 1시간**

궁금한 점이 있으면 [Supabase Discord](https://discord.supabase.com) 또는 [Twilio Support](https://support.twilio.com)에 문의하세요.
