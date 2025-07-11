import { redirect } from '@sveltejs/kit';
import { create_api } from '$lib/supabase/api';

export const load = async ({ locals: { supabase } }) => {
	const api = create_api(supabase);

	// 모든 대기 중인 출금 요청 조회
	const pending_withdrawals = await api.moon_withdrawals.select_all_pending();

	// 최근 처리된 요청들도 조회 (최근 30개)
	const recent_withdrawals = await api.moon_withdrawals.select_recent(30);

	return {
		pending_withdrawals: pending_withdrawals || [],
		recent_withdrawals: recent_withdrawals || [],
	};
};
