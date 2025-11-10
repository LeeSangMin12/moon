import { create_api } from '$lib/supabase/api';

export const load = async ({ parent, locals: { supabase } }) => {
	const api = create_api(supabase);

	const { user } = await parent();

	// 필수 데이터: minimal=true로 빠른 렌더링 (vote, bookmark, comment count 제외)
	const posts = await api.posts.select_infinite_scroll('', '', 10, true);

	// 2. 선택적 데이터: 스트리밍 (Promise 그대로 반환)
	// 로그인한 사용자에게만 필요한 데이터는 스트리밍으로 처리
	const streamed_data = {};

	if (user?.id) {
		// 커뮤니티 데이터 스트리밍
		streamed_data.communities = api.community_members
			.select_by_user_id(user.id)
			.then((members) => members.map((m) => m.communities))
			.catch((error) => {
				console.error('Failed to load communities:', error);
				return [];
			});

		// 알림 카운트 스트리밍
		streamed_data.unread_count = api.notifications
			.select_unread_count(user.id)
			.catch((error) => {
				console.error('Failed to load unread count:', error);
				return 0;
			});
	}

	return {
		posts, // 즉시 반환 (SSR)
		...streamed_data, // Promise 반환 (스트리밍)
	};
};
