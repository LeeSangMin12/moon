import { create_api } from '$lib/supabase/api';

export async function load({ params, parent, locals: { supabase }, setHeaders }) {
	const api = create_api(supabase);

	const { user } = await parent();

	// 로그인한 사용자는 private 캐시, 미로그인 사용자는 public 캐시
	setHeaders({
		'Cache-Control': user?.id
			? 'private, max-age=60, must-revalidate'
			: 'public, max-age=300, stale-while-revalidate=600',
	});

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
