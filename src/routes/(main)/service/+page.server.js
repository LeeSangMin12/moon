import { create_api } from '$lib/supabase/api';

export async function load({ params, parent, locals: { supabase }, setHeaders }) {
	const api = create_api(supabase);

	// Set cache headers for better performance
	setHeaders({
		'Cache-Control': 'public, max-age=60, s-maxage=300',
	});

	// STREAMING: Don't wait for user, start loading immediately
	const userPromise = parent().then(({ user }) => user);

	// Load services immediately (most important)
	const servicesPromise = api.services.select_infinite_scroll('');

	// Load likes only if user exists
	const serviceLikesPromise = userPromise.then(user =>
		user?.id ? api.service_likes.select_by_user_id(user.id) : []
	);

	return {
		services: servicesPromise,
		service_likes: serviceLikesPromise,
		expert_requests: [], // Load lazily on tab switch
	};
}
