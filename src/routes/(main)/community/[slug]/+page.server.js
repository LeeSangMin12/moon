import { create_api } from '$lib/supabase/api';

export async function load({ params, parent, locals: { supabase } }) {
	const { user } = await parent();
	const api = create_api(supabase);

	let community_members = [];

	if (user) {
		community_members = await api.community_members.select_by_user_id(user.id);
	}

	const community = await api.communities.select_by_slug(params.slug);
	const posts = await api.posts.select_by_community_id(community.id);

	return {
		community,
		community_members,
		posts,
	};
}
