import { create_api } from '$lib/supabase/api';

export async function load({ params, parent, locals: { supabase }, setHeaders }) {
	const api = create_api(supabase);
	const { handle } = params;

	setHeaders({
		'Cache-Control': 'public, max-age=60, s-maxage=300',
	});

	// Fetch user first (required for other queries)
	const user = await api.users.select_by_handle(handle);

	// STREAMING: Execute remaining queries in parallel
	const [posts, follower_count, following_count] = await Promise.all([
		api.posts.select_by_user_id(user.id, 10),
		api.user_follows.get_follower_count(user.id),
		api.user_follows.get_following_count(user.id),
	]);

	return { user, posts, follower_count, following_count };
}
