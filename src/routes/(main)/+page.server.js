import { create_api } from '$lib/supabase/api';

export const load = async ({ parent, locals: { supabase }, setHeaders }) => {
	const { user } = await parent();
	const api = create_api(supabase);

	// Set cache headers for better performance
	setHeaders({
		'Cache-Control': 'public, max-age=60, s-maxage=300',
	});

	// Load only first 5 posts initially for faster LCP
	const posts = await api.posts.select_infinite_scroll('', '', 20);

	if (user?.id) {
		const joined_communities = await api.community_members.select_by_user_id(
			user.id,
		);

		return {
			joined_communities: joined_communities.map((cm) => cm.communities),
			posts,
		};
	}

	return { posts };
};
