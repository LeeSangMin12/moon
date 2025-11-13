# 🔔 푸시 알림 구현 가이드 (네이티브 전용)

## ✅ 완료된 작업

### 서버 사이드
- ✅ Firebase Admin SDK 설정
- ✅ 푸시 발송 함수 구현
- ✅ 알림 템플릿 시스템 (15개 타입)
- ✅ 기존 알림 API에 푸시 발송 통합

### 데이터베이스
- ✅ `user_devices` 테이블 (FCM 토큰 저장)
- ✅ `notification_settings` 테이블 (알림 설정)

### 클라이언트 (네이티브 앱)
- ✅ Capacitor Push Notifications 플러그인
- ✅ FCM 토큰 자동 등록
- ✅ 푸시 수신 및 딥링크 처리

---

## 🚀 설정 방법

### 1단계: Firebase Admin SDK 환경 변수 (이미 완료)

`.env.local`에 이미 추가되어 있습니다:
```bash
FIREBASE_PROJECT_ID = moon-68d95
FIREBASE_PRIVATE_KEY_ID = 56ab3d7fa4c1db37894100c52b7424cf4adf99e4
FIREBASE_PRIVATE_KEY = "-----BEGIN PRIVATE KEY-----\n..."
FIREBASE_CLIENT_EMAIL = firebase-adminsdk-fbsvc@moon-68d95.iam.gserviceaccount.com
FIREBASE_CLIENT_ID = 109968767365233209812
FIREBASE_CLIENT_CERT_URL = https://...
```

### 2단계: Supabase 마이그레이션

`supabase_migrations/20251113_add_fcm_tokens.sql` 파일을 Supabase SQL Editor에서 실행:

```sql
-- user_devices 테이블 생성
-- notification_settings 테이블 생성
-- 트리거 및 기본 데이터 생성
```

### 3단계: google-services.json 파일 추가

Firebase Console에서 다운로드한 파일을:
```
android/app/google-services.json
```
위치에 복사

### 4단계: Capacitor 동기화 및 빌드

```bash
npm run cap:sync
cd android
./gradlew assembleDebug
```

### 5단계: 로그인 후 FCM 토큰 등록

로그인 후 실행되는 곳에 추가 (예: `src/routes/(main)/+layout.svelte`):

```javascript
import { register_fcm_token } from '$lib/firebase/messaging.js';
import { get_api_context, get_user_context } from '$lib/contexts/app_context.svelte.js';

const me = get_user_context();
const api = get_api_context();

// 로그인 후 FCM 토큰 자동 등록
$effect(() => {
  if (me.id) {
    register_fcm_token(api, me.id);
  }
});
```

---

## 📱 작동 흐름

### 1. 앱 시작
```
사용자 로그인
→ register_fcm_token() 호출
→ Capacitor Push 플러그인이 FCM 토큰 발급
→ Supabase user_devices 테이블에 저장
```

### 2. 알림 발생
```
다른 사용자가 좋아요 클릭
→ 서버에서 notifications.insert() 호출
→ 자동으로 send_push_notification() 실행
→ user_devices에서 토큰 조회
→ Firebase Admin SDK로 푸시 발송
→ 사용자 디바이스에 알림 도착
```

### 3. 알림 클릭
```
사용자가 푸시 알림 터치
→ pushNotificationActionPerformed 리스너 실행
→ link_url로 자동 이동 (딥링크)
```

---

## 📝 주요 차이점 (surveymoa 방식)

| 항목 | 이전 (복잡) | 현재 (간단) |
|-----|-----------|-----------|
| Firebase Web SDK | 필요 ❌ | **불필요** ✅ |
| VAPID 키 | 필요 ❌ | **불필요** ✅ |
| 웹 푸시 | 지원 | **미지원** (네이티브만) |
| 설정 복잡도 | 높음 | **낮음** ✅ |
| 패키지 크기 | 큼 | **작음** ✅ |

---

## 🧪 테스트 방법

### 1. FCM 토큰 확인
앱 실행 후 Android Logcat:
```
✅ FCM token received: ey...
✅ FCM token saved to database
```

### 2. Supabase 확인
```sql
SELECT * FROM user_devices WHERE user_id = 'your-user-id';
```

### 3. 푸시 테스트
1. 계정 A로 로그인
2. 계정 B에서 게시글 좋아요
3. 계정 A 디바이스에 푸시 알림 수신 확인

---

## 🎯 15개 알림 타입

모든 알림 타입이 자동으로 푸시 알림을 발송합니다:

- `post.liked` - 게시글 좋아요
- `service.liked` - 서비스 좋아요
- `comment.created` - 댓글 작성
- `comment.reply` - 답글 작성
- `follow.created` - 팔로우
- `order.created` - 주문 생성
- `order.approved` - 주문 승인
- `order.completed` - 서비스 완료
- `review.created` - 리뷰 작성
- `expert_review.created` - 전문가 리뷰
- `proposal.accepted` - 제안 수락
- `gift.received` - 선물 받음
- `coffee_chat.requested` - 커피챗 요청
- `coffee_chat.accepted` - 커피챗 수락
- `coffee_chat.rejected` - 커피챗 거절

---

## ⚙️ 알림 설정 (사용자별)

사용자가 알림을 개별적으로 on/off할 수 있습니다:

```javascript
// 푸시 알림 전체 끄기
await api.notification_settings.toggle_push(user_id, false);

// 특정 알림 타입만 끄기
await api.notification_settings.toggle_type(user_id, 'post.liked', false);
```

UI는 별도로 구현 필요 (설정 페이지)

---

## 🔧 문제 해결

### 푸시가 안 올 때
1. FCM 토큰이 DB에 저장되었는지 확인
2. google-services.json 파일이 있는지 확인
3. Firebase Admin SDK 환경 변수 확인
4. 서버 로그에서 푸시 발송 실패 원인 확인

### 빌드 오류
1. google-services.json 위치 확인
2. Gradle 동기화: `npm run cap:sync`
3. 캐시 삭제: `./gradlew clean`

---

## 🎉 완료!

이제 surveymoa처럼 간단하고 명확한 푸시 알림 시스템이 완성되었습니다!

**핵심**:
- ✅ Capacitor Push Notifications 플러그인만 사용
- ✅ Firebase Web SDK 불필요
- ✅ 네이티브 앱 전용
- ✅ 모든 알림 자동 푸시 발송
