import { create_api } from '$lib/supabase/api';

export async function load({ params, parent, locals: { supabase }, setHeaders }) {
	const { user } = await parent();
	const api = create_api(supabase);

	// Set cache headers for better performance
	setHeaders({
		'Cache-Control': 'public, max-age=60, s-maxage=300',
	});

	// Only load services initially - expert_requests loaded on tab switch
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
