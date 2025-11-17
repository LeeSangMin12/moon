import { json, error } from '@sveltejs/kit';
import { create_api } from '$lib/supabase/api.js';
import { PORTONE_REST_API_KEY, PORTONE_REST_API_SECRET } from '$env/static/private';

// 포트원 액세스 토큰 발급
async function get_portone_access_token() {
	const response = await fetch('https://api.iamport.kr/users/getToken', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			imp_key: PORTONE_REST_API_KEY,
			imp_secret: PORTONE_REST_API_SECRET,
		}),
	});

	if (!response.ok) {
		throw new Error('Failed to get PortOne access token');
	}

	const data = await response.json();
	return data.response.access_token;
}

// 포트원에서 결제 정보 조회
async function fetch_portone_payment(imp_uid, access_token) {
	const response = await fetch(`https://api.iamport.kr/payments/${imp_uid}`, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${access_token}`,
		},
	});

	if (!response.ok) {
		throw new Error('Failed to fetch payment from PortOne');
	}

	const data = await response.json();
	return data.response;
}

export const POST = async ({ request, locals }) => {
	try {
		const { imp_uid, merchant_uid } = await request.json();

		console.log('🔍 [결제 검증] imp_uid:', imp_uid);
		console.log('🔍 [결제 검증] merchant_uid:', merchant_uid);

		// 1. 포트원에서 실제 결제 상태 조회
		const access_token = await get_portone_access_token();
		const payment_data = await fetch_portone_payment(imp_uid, access_token);

		console.log('🔍 [결제 검증] 포트원 응답:', {
			status: payment_data.status,
			amount: payment_data.amount,
			paid_at: payment_data.paid_at,
		});

		// 2. DB 조회 (merchant_uid 또는 imp_uid로 조회)
		const api = create_api(locals.supabase);
		let transaction = await api.payments.select_by_merchant_uid(merchant_uid);

		// merchant_uid로 못 찾으면 LIKE로 검색 (포트원이 merchant_uid를 자른 경우)
		if (!transaction && merchant_uid) {
			console.log('⚠️ [결제 검증] merchant_uid로 찾지 못함, LIKE 검색 시도');
			const { data } = await locals.supabase
				.from('payment_transactions')
				.select('*')
				.like('merchant_uid', `${merchant_uid}%`)
				.eq('status', 'pending')
				.order('created_at', { ascending: false })
				.limit(1)
				.maybeSingle();

			transaction = data;
		}

		// imp_uid로 조회
		if (!transaction) {
			console.log('⚠️ [결제 검증] LIKE 검색 실패, imp_uid로 재시도');
			transaction = await api.payments.select_by_imp_uid(imp_uid);
		}

		// 그래도 없으면 사용자 정보를 가져와서 새로 생성
		if (!transaction) {
			console.log('⚠️ [결제 검증] DB에 거래 없음, 새로 생성');
			const { auth_user } = await locals.get_user();

			if (!auth_user?.id) {
				error(401, 'User not authenticated');
			}

			transaction = await api.payments.insert_transaction({
				user_id: auth_user.id,
				merchant_uid: merchant_uid,
				imp_uid: imp_uid,
				amount: payment_data.amount,
				status: 'pending',
			});
		}

		// 3. 결제 상태에 따라 DB 업데이트
		if (payment_data.status === 'paid') {
			// 결제 완료
			console.log('✅ [결제 검증] 결제 완료 확인 - DB 업데이트');
			console.log('✅ [결제 검증] 거래 ID:', transaction.id);

			// ID로 업데이트 (merchant_uid가 잘린 경우에도 정확하게 업데이트)
			const updated = await api.payments.update_status(transaction.id, {
				imp_uid: payment_data.imp_uid,
				status: 'completed',
				payment_method: payment_data.pay_method,
				pg_provider: payment_data.pg_provider,
				pg_tid: payment_data.pg_tid,
				receipt_url: payment_data.receipt_url,
				card_name: payment_data.card_name,
				card_number: payment_data.card_number,
			});

			console.log('✅ [결제 검증] 업데이트 완료:', updated);

			return json({
				success: true,
				status: 'paid',
				transaction: updated,
			});
		} else if (payment_data.status === 'cancelled') {
			// 결제 취소
			console.log('⚠️ [결제 검증] 결제 취소 확인');

			await api.payments.update_status(transaction.id, {
				status: 'cancelled',
				cancel_reason: payment_data.cancel_reason || '사용자 취소',
			});

			return json({
				success: false,
				status: 'cancelled',
			});
		} else {
			// 기타 상태 (ready, failed 등)
			console.log('⚠️ [결제 검증] 기타 상태:', payment_data.status);

			return json({
				success: false,
				status: payment_data.status,
			});
		}
	} catch (err) {
		console.error('❌ [결제 검증] 에러:', err);
		error(500, err.message || 'Payment verification failed');
	}
};
