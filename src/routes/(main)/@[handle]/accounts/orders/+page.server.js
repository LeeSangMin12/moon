import { create_api } from '$lib/supabase/api';

export async function load({ parent, locals: { supabase } }) {
	const { user } = await parent();

	if (!user) {
		return {
			my_orders: [],
			my_sales: [],
		};
	}

	const api = create_api(supabase);

	try {
		// 내가 구매한 주문들
		const my_orders = await api.service_orders.select_by_buyer_id(user.id);

		// 내가 판매한 주문들
		const my_sales = await api.service_orders.select_by_seller_id(user.id);

		return {
			my_orders,
			my_sales,
		};
	} catch (error) {
		console.error('주문 내역 로드 실패:', error);
		return {
			my_orders: [],
			my_sales: [],
		};
	}
}
