import { create_api } from '$lib/supabase/api';

export async function load({ params, parent, locals: { supabase }, setHeaders }) {
	const api = create_api(supabase);
	const { handle } = params;

	// 사용자별 데이터(북마크, 좋아요, 팔로우 상태)가 포함되므로 캐시 비활성화
	setHeaders({
		'Cache-Control': 'private, max-age=0, must-revalidate',
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
