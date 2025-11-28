import { create_api } from '$lib/supabase/api';
import { redirect } from '@sveltejs/kit';

export const load = async ({ parent, locals: { supabase } }) => {
	const { user } = await parent();

	if (!user) {
		redirect(303, '/login');
	}

	const api = create_api(supabase);

	// 병렬로 데이터 조회
	const [settleable_amount, pending_settlements, my_sales] = await Promise.all([
		api.seller_settlements.get_settleable_amount(user.id),
		api.seller_settlements.select_pending_by_seller_id(user.id),
		api.service_orders.select_by_seller_id(user.id),
	]);

	// 판매 통계 계산
	const completed_sales = my_sales.filter((s) => s.status === 'completed');
	const pending_sales = my_sales.filter((s) => s.status === 'pending' || s.status === 'paid');

	return {
		settleable_amount,
		has_pending_settlement: pending_settlements.length > 0,
		stats: {
			total_sales: my_sales.length,
			completed_sales: completed_sales.length,
			pending_sales: pending_sales.length,
		},
	};
};
