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
		// moon_charges 테이블이 존재하는지 확인
		const { error: table_check_error } = await supabase
			.from('moon_charges')
			.select('count', { count: 'exact', head: true })
			.limit(1);

		if (table_check_error) {
			console.error(
				'moon_charges 테이블이 존재하지 않습니다:',
				table_check_error,
			);
			return {
				pending_charges: [],
				recent_charges: [],
				user: user,
				table_missing: true,
			};
		}

		// 모든 대기 중인 충전 요청 조회
		const pending_charges = await api.moon_charges.select_all_pending();

		// 최근 처리된 요청들도 조회 (최근 30개)
		const { data: recent_charges } = await supabase
			.from('moon_charges')
			.select('*, users(id, name, handle)')
			.in('status', ['approved', 'rejected'])
			.order('updated_at', { ascending: false })
			.limit(30);

		return {
			pending_charges: pending_charges || [],
			recent_charges: recent_charges || [],
			user: user,
			table_missing: false,
		};
	} catch (error) {
		console.error('관리자 페이지 데이터 로드 실패:', error);
		return {
			pending_charges: [],
			recent_charges: [],
			user: user,
			table_missing: true,
			error: error.message,
		};
	}
};
