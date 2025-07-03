import { redirect } from '@sveltejs/kit';
import { create_api } from '$lib/supabase/api';

export const load = async ({ locals: { supabase, get_user } }) => {
	const { auth_user } = await get_user();

	// 로그인 확인
	if (!auth_user?.id) {
		redirect(302, '/login');
	}

	const api = create_api(supabase);

	// 사용자 정보 조회
	const user = await api.users.select(auth_user.id);

	if (!user || user.role !== 'admin') {
		redirect(302, '/');
	}

	try {
		// 모든 대기 중인 출금 요청 조회
		const pending_withdrawals = await api.moon_withdrawals.select_all_pending();

		// 최근 처리된 요청들도 조회 (최근 30개)
		const recent_withdrawals = await api.moon_withdrawals.select_recent(30);

		return {
			pending_withdrawals: pending_withdrawals || [],
			recent_withdrawals: recent_withdrawals || [],
			user: user,
		};
	} catch (error) {
		console.log(error);
		return {
			pending_withdrawals: [],
			recent_withdrawals: [],
			user: user,
			error: error.message,
		};
	}
};
