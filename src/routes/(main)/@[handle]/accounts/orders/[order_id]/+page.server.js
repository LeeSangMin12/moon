import { create_api } from '$lib/supabase/api';
import { error } from '@sveltejs/kit';

export async function load({ params, parent, locals: { supabase } }) {
	const { user } = await parent();

	if (!user) {
		throw error(401, '로그인이 필요합니다.');
	}

	const api = create_api(supabase);
	const order_id = parseInt(params.order_id);

	try {
		// 주문 조회
		const order = await api.service_orders.select_by_id(order_id);

		if (!order) {
			throw error(404, '주문을 찾을 수 없습니다.');
		}

		// 권한 확인: 구매자 또는 판매자만 볼 수 있음
		if (order.buyer_id !== user.id && order.seller_id !== user.id) {
			throw error(403, '이 주문을 볼 권한이 없습니다.');
		}

		// 주문 옵션 조회
		const order_options = await api.order_options.select_by_order_id(order_id);

		// 현재 사용자의 역할 판단
		const is_buyer = order.buyer_id === user.id;
		const is_seller = order.seller_id === user.id;

		return {
			order,
			order_options,
			is_buyer,
			is_seller,
		};
	} catch (err) {
		console.error('주문 상세 로드 실패:', err);
		throw error(500, '주문 정보를 불러오는데 실패했습니다.');
	}
}
