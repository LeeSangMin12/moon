import { create_api } from '$lib/supabase/api';
import { error } from '@sveltejs/kit';

export async function load({ params, parent, locals: { supabase } }) {
	const { user } = await parent();
	const api = create_api(supabase);
	
	try {
		// 전문가 요청 상세 정보 조회
		const expert_request = await api.expert_requests.select_by_id(parseInt(params.id));
		
		if (!expert_request) {
			throw error(404, '전문가 요청을 찾을 수 없습니다.');
		}
		
		// 해당 요청에 대한 제안서들 조회
		const proposals = await api.expert_request_proposals.select_by_request_id(parseInt(params.id));
		
		return {
			expert_request,
			proposals,
			user
		};
	} catch (err) {
		console.error('Expert request detail loading error:', err);
		throw error(500, '데이터를 불러오는 중 오류가 발생했습니다.');
	}
}