import { create_api } from '$lib/supabase/api';

export async function load({ params, parent, locals: { supabase }, setHeaders }) {
	const api = create_api(supabase);

	// 사용자별 데이터(서비스 좋아요)가 포함되므로 캐시 비활성화
	setHeaders({
		'Cache-Control': 'private, max-age=0, must-revalidate',
	});

	const { user } = await parent();

	// Parallel queries
	const [services, service_likes] = await Promise.all([
		api.services.select_infinite_scroll(''),
		user?.id ? api.service_likes.select_by_user_id(user.id) : Promise.resolve([])
	]);

	return {
		services,
		service_likes,
		expert_requests: [], // Load lazily on tab switch
	};
}
