import { create_api } from '$lib/supabase/api';

export const load = async ({ locals: { supabase } }) => {
	const api = create_api(supabase);

	// 병렬로 데이터 조회
	const [pending_settlements, recent_settlements] = await Promise.all([
		api.seller_settlements.select_all_pending(),
		api.seller_settlements.select_all(null, 30),
	]);

	// 최근 처리된 요청 필터링 (pending 제외)
	const processed_settlements = recent_settlements.filter((s) => s.status !== 'pending');

	return {
		pending_settlements: pending_settlements || [],
		processed_settlements: processed_settlements || [],
	};
};
