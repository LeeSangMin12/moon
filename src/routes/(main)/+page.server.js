import { create_api } from '$lib/supabase/api';

export const load = async ({ parent, locals: { supabase }, setHeaders }) => {
	const { user } = await parent();
	const api = create_api(supabase);

	// Set cache headers for better performance
	setHeaders({
		'Cache-Control': 'public, max-age=60, s-maxage=300',
	});

	// Load initial data in parallel for faster response
	if (user?.id) {
		const [posts, joined_communities] = await Promise.all([
			api.posts.select_infinite_scroll('', '', 10), // Reduced from 20 to 10 for faster LCP
			api.community_members.select_by_user_id(user.id)
		]);

		return {
			joined_communities: joined_communities.map((cm) => cm.communities),
			posts,
		};
	}

	// For non-logged-in users, only load minimal posts
	const posts = await api.posts.select_infinite_scroll('', '', 10);
	return { posts, joined_communities: [] };
};
