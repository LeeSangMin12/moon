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
 * 포트원 결제 취소 요청
 */
async function request_cancel_to_portone(access_token, imp_uid, merchant_uid, reason) {
	const response = await fetch('https://api.iamport.kr/payments/cancel', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: access_token,
		},
		body: JSON.stringify({
			imp_uid: imp_uid,
			merchant_uid: merchant_uid,
			reason: reason,
		}),
	});

	const data = await response.json();

	if (data.code !== 0) {
		throw new Error(`Failed to cancel payment: ${data.message}`);
	}

	return data.response;
}

/**
 * 결제 취소 API
 */
export const POST = async ({ request, locals }) => {
	try {
		const { transaction_id, cancel_reason } = await request.json();

		// 필수 파라미터 체크
		if (!transaction_id || !cancel_reason) {
			error(400, 'Missing required parameters');
		}

		const api = create_api(locals.supabase);

		// 거래 조회
		const transaction = await api.payments.select_by_id(transaction_id);

		if (!transaction) {
			error(404, 'Transaction not found');
		}

		// 이미 취소된 거래 체크
		if (transaction.status === 'cancelled' || transaction.status === 'refunded') {
			error(400, 'Already cancelled or refunded');
		}

		// 완료된 거래만 취소 가능
		if (transaction.status !== 'completed') {
			error(400, 'Only completed transactions can be cancelled');
		}

		// 포트원 API 호출
		try {
			// 1. 액세스 토큰 발급
			const access_token = await get_portone_access_token();

			// 2. 결제 취소 요청
			const cancel_result = await request_cancel_to_portone(
				access_token,
				transaction.imp_uid,
				transaction.merchant_uid,
				cancel_reason,
			);

			console.log('[Payment Cancel] Success:', cancel_result);

			// 3. DB 업데이트
			const updated = await api.payments.cancel_transaction(
				transaction_id,
				cancel_reason,
			);

			return json({
				success: true,
				data: updated,
				message: 'Payment cancelled successfully',
			});
		} catch (portone_error) {
			console.error('[Payment Cancel] PortOne API Error:', portone_error);
			error(500, `Failed to cancel payment: ${portone_error.message}`);
		}
	} catch (err) {
		console.error('[Payment Cancel] Error:', err);

		// SvelteKit error는 그대로 throw
		if (err.status) {
			throw err;
		}

		error(500, 'Internal server error');
	}
};
