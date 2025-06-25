import { create_api } from '$lib/supabase/api';

export const load = async ({ parent, locals: { supabase } }) => {
	const { user } = await parent();
	const api = create_api(supabase);

	const posts = await api.posts.select_infinite_scroll('', '');

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
