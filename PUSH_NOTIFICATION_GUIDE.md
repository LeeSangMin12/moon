# 🔔 푸시 알림 구현 완료 가이드

## 📋 완료된 작업

### ✅ 서버 사이드
- [x] Firebase Admin SDK 설정 (`src/lib/server/firebase_admin.js`)
- [x] 푸시 발송 함수 구현 (`src/lib/server/push_notification.js`)
- [x] 알림 템플릿 시스템 (`src/lib/utils/notification_templates.js`)
- [x] 기존 알림 API에 푸시 발송 통합 (`src/lib/supabase/notifications.js`)

### ✅ 데이터베이스
- [x] `user_devices` 테이블 (FCM 토큰 저장)
- [x] `notification_settings` 테이블 (알림 설정)
- [x] 마이그레이션 SQL 파일 (`supabase_migrations/20251113_add_fcm_tokens.sql`)

### ✅ API 레이어
- [x] `user_devices` API (`src/lib/supabase/user_devices.js`)
- [x] `notification_settings` API (`src/lib/supabase/notification_settings.js`)
- [x] Main API에 통합 (`src/lib/supabase/api.js`)

### ✅ 클라이언트 사이드
- [x] FCM 토큰 등록 로직 (`src/lib/firebase/messaging.js`)
- [x] Capacitor 푸시 플러그인 설정 (`capacitor.config.ts`)
- [x] Firebase SDK 설치

### ✅ 패키지
- [x] `firebase-admin` (서버)
- [x] `firebase` (클라이언트)
- [x] `@capacitor/push-notifications`

---

## 🚀 시작하기

### 1단계: Firebase 프로젝트 설정

#### 1.1 Firebase Console
1. https://console.firebase.google.com/ 접속
2. "프로젝트 추가" 클릭
3. 프로젝트 이름: `moon` 입력
4. Google Analytics 활성화 (선택사항)

#### 1.2 Android 앱 등록
1. Firebase 프로젝트에서 "Android" 아이콘 클릭
2. Android 패키지 이름: `kr.it.moon`
3. 앱 닉네임: `Moon`
4. **`google-services.json` 다운로드**
5. 다운로드한 파일을 `android/app/` 폴더에 복사

#### 1.3 Firebase Admin SDK 키 생성
1. 프로젝트 설정 → 서비스 계정
2. "새 비공개 키 생성" 클릭
3. JSON 파일 다운로드
4. JSON 파일 열어서 환경 변수 설정 (다음 단계 참조)

---

### 2단계: 환경 변수 설정

#### 2.1 서버 사이드 (Firebase Admin SDK)
`.env` 파일 생성 (또는 `.env.firebase.example` 복사):

```bash
# Firebase Admin SDK (서버용)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=123456789012345678901
FIREBASE_CLIENT_CERT_URL=https://www.googleapis.com/robot/v1/metadata/x509/...
```

#### 2.2 클라이언트 사이드 (Firebase Web SDK)
`.env` 또는 `.env.local`에 추가:

```bash
# Firebase Web SDK (클라이언트용)
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:...
VITE_FIREBASE_VAPID_KEY=BM... (웹 푸시용, Cloud Messaging 탭에서 생성)
```

Firebase Console → 프로젝트 설정 → 일반 탭에서 웹 앱 추가 후 위 값들 복사

---

### 3단계: 데이터베이스 마이그레이션

Supabase SQL Editor에서 `supabase_migrations/20251113_add_fcm_tokens.sql` 파일 내용을 실행:

```sql
-- user_devices 테이블 생성
CREATE TABLE IF NOT EXISTS user_devices (...);

-- notification_settings 테이블 생성
CREATE TABLE IF NOT EXISTS notification_settings (...);

-- 트리거 및 기본 데이터 생성
...
```

또는 MCP 도구 사용:
```bash
# Supabase CLI가 설정되어 있다면
supabase migration apply 20251113_add_fcm_tokens.sql
```

---

### 4단계: Android 빌드

```bash
# Capacitor 동기화
npm run cap:sync
# 또는
npx cap sync android

# Android 빌드
cd android
./gradlew assembleDebug
```

**중요**: `google-services.json` 파일이 `android/app/` 폴더에 있어야 빌드가 성공합니다!

---

### 5단계: 클라이언트에서 FCM 토큰 등록

로그인 후 자동으로 FCM 토큰을 등록하도록 코드 추가:

```javascript
// src/routes/(main)/+layout.svelte 또는 로그인 후 실행되는 곳
import { register_fcm_token } from '$lib/firebase/messaging.js';
import { get_api_context, get_user_context } from '$lib/contexts/app_context.svelte.js';

const me = get_user_context();
const api = get_api_context();

// 로그인 후 FCM 토큰 등록
$effect(() => {
  if (me.id) {
    register_fcm_token(api, me.id);
  }
});
```

---

## 🧪 테스트 방법

### 1. FCM 토큰 등록 확인
앱 실행 후 브라우저 콘솔 또는 Android Logcat에서:
```
✅ FCM token registered: ey...
```

### 2. Supabase 데이터베이스 확인
```sql
SELECT * FROM user_devices WHERE user_id = 'your-user-id';
```

### 3. 푸시 알림 테스트
1. 다른 계정으로 로그인
2. 게시글에 좋아요 클릭
3. 첫 번째 계정에서 푸시 알림 수신 확인

### 4. 서버 로그 확인
```bash
# 개발 서버 실행 중
✅ Push sent: 1 success, 0 failed
```

---

## 📱 알림 타입

현재 구현된 알림 타입 (총 15개):

| 알림 타입 | 설명 | 트리거 |
|----------|------|--------|
| `post.liked` | 게시글 좋아요 | 게시글 좋아요 클릭 |
| `service.liked` | 서비스 좋아요 | 서비스 좋아요 클릭 |
| `comment.created` | 댓글 작성 | 게시글에 댓글 작성 |
| `comment.reply` | 답글 작성 | 댓글에 답글 작성 |
| `follow.created` | 팔로우 | 사용자 팔로우 |
| `order.created` | 주문 생성 | 서비스 주문 |
| `order.approved` | 주문 승인 | 판매자가 주문 승인 |
| `order.completed` | 서비스 완료 | 판매자가 서비스 완료 처리 |
| `review.created` | 리뷰 작성 | 서비스 리뷰 작성 |
| `expert_review.created` | 전문가 리뷰 작성 | 전문가 요청 리뷰 작성 |
| `proposal.accepted` | 제안 수락 | 전문가 제안 수락 |
| `gift.received` | 선물 받음 | 선물 받음 |
| `coffee_chat.requested` | 커피챗 요청 | 커피챗 신청 |
| `coffee_chat.accepted` | 커피챗 수락 | 커피챗 수락 |
| `coffee_chat.rejected` | 커피챗 거절 | 커피챗 거절 |

---

## ⚙️ 알림 설정

사용자는 `notification_settings` 테이블을 통해 알림을 개별적으로 on/off할 수 있습니다:

```javascript
// 푸시 알림 전체 끄기
await api.notification_settings.toggle_push(user_id, false);

// 특정 알림 타입 끄기
await api.notification_settings.toggle_type(user_id, 'post.liked', false);
```

UI는 별도로 구현 필요 (Settings 페이지 등)

---

## 🔧 문제 해결

### 푸시가 안 올 때
1. **FCM 토큰 확인**: Supabase `user_devices` 테이블 확인
2. **알림 설정 확인**: `notification_settings.push_enabled = true`인지 확인
3. **환경 변수 확인**: Firebase Admin SDK 키가 올바른지 확인
4. **서버 로그 확인**: 푸시 발송 실패 로그 확인

### Android 빌드 오류
1. **google-services.json 없음**: `android/app/` 폴더에 파일 있는지 확인
2. **Java 버전 오류**: Java 17 사용 중인지 확인
3. **Gradle 캐시 문제**: `./gradlew clean` 후 재빌드

### iOS 설정 (TODO)
현재는 Android만 완료되었습니다. iOS를 추가하려면:
1. Firebase Console에서 iOS 앱 등록
2. `GoogleService-Info.plist` 다운로드 → `ios/App/App/` 복사
3. APNs 인증서 설정
4. iOS 푸시 권한 요청 코드 추가

---

## 📚 추가 구현 가능 기능

### 1. 알림 설정 UI
사용자가 알림을 개별적으로 on/off할 수 있는 설정 페이지

### 2. 알림 그룹화
Android에서 여러 알림을 하나로 그룹화

### 3. 알림 액션 버튼
푸시 알림에 "수락", "거절" 같은 액션 버튼 추가

### 4. 배지 카운트 자동 업데이트
앱 아이콘 배지를 읽지 않은 알림 수로 업데이트

### 5. 예약 푸시
특정 시간에 푸시 발송 (Supabase Edge Functions 활용)

---

## 🎉 완료!

이제 푸시 알림 시스템이 완전히 구현되었습니다!

모든 주요 이벤트(좋아요, 댓글, 팔로우 등)에서 자동으로 푸시 알림이 발송됩니다.

문제가 발생하면 위의 문제 해결 섹션을 참고하거나 로그를 확인하세요.
