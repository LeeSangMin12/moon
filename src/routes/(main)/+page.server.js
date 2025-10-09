import { create_api } from '$lib/supabase/api';

export const load = async ({ parent, locals: { supabase }, setHeaders }) => {
	const api = create_api(supabase);

	// Set cache headers for better performance
	setHeaders({
		'Cache-Control': 'public, max-age=60, s-maxage=300',
	});

	// Parallel queries with Promise.all
	const { user } = await parent();

	const [posts, joined_communities] = await Promise.all([
		api.posts.select_infinite_scroll('', '', 10),
		user?.id
			? api.community_members.select_by_user_id(user.id).then(cms => cms.map(cm => cm.communities))
			: Promise.resolve([])
	]);

	return {
		posts,
		joined_communities
	};
};
