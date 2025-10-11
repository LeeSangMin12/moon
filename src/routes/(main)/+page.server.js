import { create_api } from '$lib/supabase/api';

export const load = async ({ parent, locals: { supabase }, setHeaders }) => {
	const api = create_api(supabase);

	// 사용자별 데이터(북마크, 좋아요)가 포함되므로 캐시 비활성화
	setHeaders({
		'Cache-Control': 'private, max-age=0, must-revalidate',
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
