import { create_api } from '$lib/supabase/api';
import { error } from '@sveltejs/kit';

export async function load({ parent, locals: { supabase } }) {
	const { user } = await parent();

	// 상위 레이아웃에서 이미 관리자 권한 체크됨

	const api = create_api(supabase);

	try {
		// 입금 대기 중인 공고 목록 조회
		const pending_requests = await api.expert_requests.select_pending_payments();

		return {
			user,
			pending_requests,
		};
	} catch (err) {
		console.error('Admin page load error:', err);
		throw error(500, '데이터를 불러오는 중 오류가 발생했습니다.');
	}
}
