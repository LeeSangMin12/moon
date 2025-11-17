# 포트원 결제 시스템 설정 가이드

이 문서는 포트원(PortOne, 구 아임포트) 결제 시스템을 설정하고 테스트하는 방법을 안내합니다.

## 1. 포트원 가입 및 설정

### 1.1 포트원 가입
1. [포트원 홈페이지](https://portone.io/)에서 회원가입
2. 로그인 후 시스템 설정 → 내 식별코드·API Keys 메뉴로 이동
3. **가맹점 식별코드** 확인 (예: `imp12345678`)

### 1.2 REST API Key 발급
1. 시스템 설정 → REST API Key 발급
2. **REST API Key** 저장 (API 호출에 사용)
3. **REST API Secret** 저장 (액세스 토큰 발급에 사용)

### 1.3 PG사 설정
1. PG 설정 → PG사 추가
2. 테스트용으로 **html5_inicis** 선택 (이니시스)
3. 테스트 모드 활성화

### 1.4 웹훅 설정
1. 시스템 설정 → 웹훅 설정
2. 웹훅 URL 입력: `https://your-domain.com/api/portone/webhook`
3. 결제 완료, 결제 취소 이벤트 활성화

## 2. 환경 변수 설정

`.env` 파일에 다음 환경 변수를 추가하세요:

```bash
# 포트원 설정
PUBLIC_PORTONE_IMP_CODE=imp12345678          # 가맹점 식별코드 (클라이언트에서 사용)
PORTONE_REST_API_KEY=your_api_key_here       # REST API Key (서버 사이드)
PORTONE_REST_API_SECRET=your_secret_here     # REST API Secret (서버 사이드)
```

**주의**:
- `PUBLIC_PORTONE_IMP_CODE`는 클라이언트에서 접근 가능 (PUBLIC_ 접두사)
- `PORTONE_REST_API_KEY`, `PORTONE_REST_API_SECRET`은 서버 사이드 전용

## 3. 코드 수정

### 3.1 클라이언트 코드 수정

`src/routes/(main)/payment/+page.svelte` 파일에서 가맹점 식별코드를 환경 변수로 변경:

```javascript
import { PUBLIC_PORTONE_IMP_CODE } from '$env/static/public';

onMount(() => {
	if (browser) {
		const script = document.createElement('script');
		script.src = 'https://cdn.iamport.kr/v1/iamport.js';
		script.async = true;
		script.onload = () => {
			is_portone_loaded = true;
			const IMP = window.IMP;
			IMP.init(PUBLIC_PORTONE_IMP_CODE); // 환경 변수 사용
		};
		document.head.appendChild(script);
	}
});
```

### 3.2 웹훅 검증 로직 추가 (선택사항)

보안을 강화하려면 `src/routes/api/portone/webhook/+server.js`에 검증 로직 추가:

```javascript
import { PORTONE_REST_API_KEY, PORTONE_REST_API_SECRET } from '$env/static/private';

// 포트원 액세스 토큰 발급
async function get_portone_access_token() {
	const response = await fetch('https://api.iamport.kr/users/getToken', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			imp_key: PORTONE_REST_API_KEY,
			imp_secret: PORTONE_REST_API_SECRET,
		}),
	});

	const data = await response.json();
	return data.response.access_token;
}

// 포트원에서 결제 정보 조회
async function fetch_portone_payment(imp_uid, access_token) {
	const response = await fetch(`https://api.iamport.kr/payments/${imp_uid}`, {
		headers: { Authorization: access_token },
	});

	const data = await response.json();
	return data.response;
}

// 웹훅 핸들러에서 사용
export const POST = async ({ request, locals }) => {
	// ... (기존 코드)

	// 포트원 서버에서 결제 정보 검증
	const access_token = await get_portone_access_token();
	const payment_data = await fetch_portone_payment(imp_uid, access_token);

	// 금액 검증
	if (payment_data.amount !== transaction.amount) {
		console.error('[PortOne Webhook] Amount mismatch');
		error(400, 'Amount mismatch');
	}

	// ... (나머지 코드)
};
```

## 4. 테스트

### 4.1 로컬 개발 환경

1. 개발 서버 실행:
```bash
npm run dev
```

2. 브라우저에서 `/payment` 페이지 접속

3. 테스트 금액 입력 후 "결제하기" 클릭

4. 포트원 테스트 카드 정보 입력:
   - 카드번호: `9446-0175-6200-9013` (테스트용)
   - 유효기간: `2025-12`
   - CVC: `777`
   - 비밀번호 앞 2자리: `00`

### 4.2 웹훅 테스트 (로컬)

로컬 환경에서 웹훅을 테스트하려면 ngrok 또는 localtunnel 사용:

```bash
# ngrok 설치 후
ngrok http 5173

# 포트원 웹훅 URL에 ngrok URL 입력
# 예: https://abc123.ngrok.io/api/portone/webhook
```

### 4.3 프로덕션 배포

1. Vercel에 환경 변수 설정:
   - Settings → Environment Variables
   - `PUBLIC_PORTONE_IMP_CODE`, `PORTONE_REST_API_KEY`, `PORTONE_REST_API_SECRET` 추가

2. 포트원 웹훅 URL을 프로덕션 URL로 변경:
   - `https://your-domain.vercel.app/api/portone/webhook`

## 5. 결제 취소/환불

클라이언트에서는 DB 상태만 변경합니다. 실제 포트원 API를 통한 취소는 서버 사이드 API를 추가로 구현해야 합니다.

### 5.1 서버 사이드 취소 API 추가 (예시)

`src/routes/api/portone/cancel/+server.js`:

```javascript
import { json, error } from '@sveltejs/kit';
import { PORTONE_REST_API_KEY, PORTONE_REST_API_SECRET } from '$env/static/private';

export const POST = async ({ request, locals }) => {
	const { imp_uid, merchant_uid, cancel_reason } = await request.json();

	// 1. 액세스 토큰 발급
	const token_response = await fetch('https://api.iamport.kr/users/getToken', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			imp_key: PORTONE_REST_API_KEY,
			imp_secret: PORTONE_REST_API_SECRET,
		}),
	});

	const token_data = await token_response.json();
	const access_token = token_data.response.access_token;

	// 2. 결제 취소 요청
	const cancel_response = await fetch('https://api.iamport.kr/payments/cancel', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: access_token,
		},
		body: JSON.stringify({
			imp_uid: imp_uid,
			merchant_uid: merchant_uid,
			reason: cancel_reason,
		}),
	});

	const cancel_data = await cancel_response.json();

	if (cancel_data.code !== 0) {
		error(400, cancel_data.message);
	}

	return json({ success: true, data: cancel_data.response });
};
```

## 6. 주요 페이지

- **결제 테스트 페이지**: `/payment`
- **웹훅 엔드포인트**: `/api/portone/webhook`

## 7. 데이터베이스

결제 거래는 `payment_transactions` 테이블에 저장됩니다:

- `merchant_uid`: 고유 거래 ID
- `imp_uid`: 포트원 거래 ID
- `status`: pending, completed, cancelled, refunded
- `amount`: 결제 금액

## 8. 문제 해결

### 8.1 포트원 SDK가 로드되지 않음
- 브라우저 콘솔에서 스크립트 로드 에러 확인
- CSP (Content Security Policy) 설정 확인

### 8.2 결제창이 열리지 않음
- `IMP.init()`이 호출되었는지 확인
- 가맹점 식별코드가 올바른지 확인

### 8.3 웹훅이 호출되지 않음
- 포트원 대시보드에서 웹훅 URL 설정 확인
- 웹훅 URL이 HTTPS인지 확인 (로컬은 ngrok 사용)
- 서버 로그에서 웹훅 수신 여부 확인

## 9. 참고 자료

- [포트원 공식 문서](https://portone.gitbook.io/docs/)
- [포트원 JavaScript SDK](https://portone.gitbook.io/docs/sdk/javascript-sdk)
- [포트원 REST API](https://portone.gitbook.io/docs/api/api)
- [포트원 웹훅](https://portone.gitbook.io/docs/result/webhook)

## 10. 보안 주의사항

1. **환경 변수 보호**: REST API Key/Secret은 절대 클라이언트에 노출하지 마세요
2. **금액 검증**: 웹훅에서 받은 금액과 DB 금액을 항상 검증하세요
3. **중복 결제 방지**: merchant_uid를 고유하게 생성하세요
4. **HTTPS 필수**: 프로덕션에서는 반드시 HTTPS를 사용하세요
5. **웹훅 검증**: 포트원 서버에서 결제 정보를 다시 조회해서 검증하세요
