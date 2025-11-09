import { create_api } from '$lib/supabase/api';

export async function load({ params, parent, locals: { supabase } }) {
	const api = create_api(supabase);

	const { user } = await parent();

	const community = await api.communities.select_by_slug(params.slug);

	const [community_members, posts, community_participants] = await Promise.all([
		user?.id ? api.community_members.select_by_user_id(user.id) : Promise.resolve([]),
		api.posts.select_by_community_id(community.id, 10),
		api.community_members.select_by_community_id(community.id)
	]);

	return {
		community,
		community_members,
		posts,
		community_participants,
	};
}
