import { create_api } from '$lib/supabase/api';

export async function load({ params, parent, locals: { supabase }, setHeaders }) {
	const api = create_api(supabase);

	// 사용자별 데이터(북마크, 참여 상태)가 포함되므로 캐시 비활성화
	setHeaders({
		'Cache-Control': 'private, max-age=0, must-revalidate',
	});

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
