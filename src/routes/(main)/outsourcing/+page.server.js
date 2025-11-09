import { create_api } from '$lib/supabase/api';

export async function load({ locals: { supabase } }) {
	const api = create_api(supabase);

	// 초기 expert_requests 데이터 로드
	const expert_requests_response = await api.expert_requests.select_infinite_scroll('');
	const expert_requests = expert_requests_response.data || expert_requests_response;

	return {
		expert_requests,
	};
}
