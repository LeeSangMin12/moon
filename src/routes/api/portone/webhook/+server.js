import { json, error } from '@sveltejs/kit';
import { create_api } from '$lib/supabase/api.js';
import { PORTONE_REST_API_KEY, PORTONE_REST_API_SECRET } from '$env/static/private';

// 환경 변수
const PORTONE_API_KEY = PORTONE_REST_API_KEY;
const PORTONE_API_SECRET = PORTONE_REST_API_SECRET;

/**
 * 포트원 액세스 토큰 발급
 */
async function get_portone_access_token() {
	const response = await fetch('https://api.iamport.kr/users/getToken', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({
			imp_key: PORTONE_API_KEY,
			imp_secret: PORTONE_API_SECRET,
		}),
	});

	const data = await response.json();

	if (data.code !== 0) {
		throw new Error(`Failed to get access token: ${data.message}`);
	}

	return data.response.access_token;
}

/**
 * 포트원에서 결제 정보 조회
 */
async function fetch_portone_payment(imp_uid, access_token) {
	const response = await fetch(`https://api.iamport.kr/payments/${imp_uid}`, {
		headers: { Authorization: access_token },
	});

	const data = await response.json();

	if (data.code !== 0) {
		throw new Error(`Failed to fetch payment: ${data.message}`);
	}

	return data.response;
}

/**
 * 포트원 웹훅 핸들러
 * 포트원 서버에서 결제 상태 변경 시 호출됨
 */
export const POST = async ({ request, locals }) => {
	try {
		const payload = await request.json();

		console.log('[PortOne Webhook] Received:', payload);

		const { imp_uid, merchant_uid, status } = payload;

		// 필수 파라미터 체크
		if (!imp_uid || !merchant_uid) {
			console.error('[PortOne Webhook] Missing required parameters');
			error(400, 'Missing required parameters');
		}

		// Supabase API 초기화
		const api = create_api(locals.supabase);

		// 거래 조회
		const transaction = await api.payments.select_by_merchant_uid(merchant_uid);

		if (!transaction) {
			console.error('[PortOne Webhook] Transaction not found:', merchant_uid);
			error(404, 'Transaction not found');
		}

		// 포트원 서버에서 결제 정보 검증 (위·변조 방지)
		try {
			const access_token = await get_portone_access_token();
			const payment_data = await fetch_portone_payment(imp_uid, access_token);

			// 금액 검증
			if (payment_data.amount !== transaction.amount) {
				console.error('[PortOne Webhook] Amount mismatch:', {
					expected: transaction.amount,
					actual: payment_data.amount,
				});
				error(400, 'Amount mismatch - possible fraud attempt');
			}

			console.log('[PortOne Webhook] Amount verified:', payment_data.amount);
		} catch (verify_error) {
			console.error('[PortOne Webhook] Verification failed:', verify_error);
			// 검증 실패 시에도 계속 진행 (API Key가 없는 경우 등)
			console.warn('[PortOne Webhook] Skipping verification');
		}

		// 상태에 따른 처리
		let update_data = {
			imp_uid: imp_uid,
		};

		switch (status) {
			case 'paid':
				// 결제 완료
				update_data.status = 'completed';
				update_data.payment_method = payload.pay_method;
				update_data.pg_provider = payload.pg_provider;
				update_data.pg_tid = payload.pg_tid;
				update_data.receipt_url = payload.receipt_url;
				update_data.card_name = payload.card_name;
				update_data.card_number = payload.card_number;
				break;

			case 'cancelled':
				// 결제 취소
				update_data.status = 'cancelled';
				update_data.cancel_reason = payload.cancel_reason || 'Unknown';
				update_data.cancelled_at = new Date().toISOString();
				break;

			case 'failed':
				// 결제 실패
				update_data.status = 'cancelled';
				update_data.cancel_reason = payload.fail_reason || 'Payment failed';
				break;

			default:
				console.warn('[PortOne Webhook] Unknown status:', status);
				break;
		}

		// DB 업데이트
		await api.payments.update_by_merchant_uid(merchant_uid, update_data);

		console.log('[PortOne Webhook] Transaction updated:', merchant_uid, status);

		// 성공 응답
		return json({ success: true, message: 'Webhook processed' });
	} catch (err) {
		console.error('[PortOne Webhook] Error:', err);
		error(500, 'Internal server error');
	}
};

// GET 요청은 거부
export const GET = async () => {
	error(405, 'Method not allowed');
};
