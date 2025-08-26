import { create_api } from '$lib/supabase/api';

export async function load({ params, parent, locals: { supabase } }) {
	const { user } = await parent();
	const api = create_api(supabase);

	const services = await api.services.select_infinite_scroll('');
	const service_likes = await api.service_likes.select_by_user_id(user?.id);
	const expert_requests_result = await api.expert_requests.select_infinite_scroll('');

	return {
		services,
		service_likes,
		expert_requests: expert_requests_result.data || expert_requests_result, // 호환성을 위해 처리
	};
}
