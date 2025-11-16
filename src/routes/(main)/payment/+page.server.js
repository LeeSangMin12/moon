import { redirect } from '@sveltejs/kit';
import { create_api } from '$lib/supabase/api';

export const load = async ({ locals: { supabase, get_user } }) => {
	const { auth_user, user } = await get_user();

	// 로그인 체크
	if (!auth_user?.id) {
		redirect(302, '/login');
	}

	const api = create_api(supabase);

	// 사용자의 결제 내역 조회
	const [transactions, stats] = await Promise.all([
		api.payments.select_by_user_id(auth_user.id),
		api.payments.select_stats(auth_user.id),
	]);

	return {
		user,
		transactions,
		stats,
	};
};
