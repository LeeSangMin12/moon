import { create_api } from '$lib/supabase/api';

export async function load({ params, parent, locals: { supabase }, setHeaders }) {
	const api = create_api(supabase);

	setHeaders({
		'Cache-Control': 'public, max-age=60, s-maxage=300',
	});

	const { user } = await parent();

	const community = await api.communities.select_by_slug(params.slug);

	const [community_members, posts, community_participants] = await Promise.all([
		user ? api.community_members.select_by_user_id(user.id) : Promise.resolve([]),
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
