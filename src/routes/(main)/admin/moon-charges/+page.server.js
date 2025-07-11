import { create_api } from '$lib/supabase/api';

export const load = async ({ locals: { supabase } }) => {
	const api = create_api(supabase);

	// 모든 대기 중인 충전 요청 조회
	const pending_charges = await api.moon_charges.select_all_pending();

	// 최근 처리된 요청들도 조회 (최근 30개)
	const recent_charges = await api.moon_charges.select_recent(30);

	return {
		pending_charges: pending_charges || [],
		recent_charges: recent_charges || [],
	};
};
