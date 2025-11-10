import { create_api } from '$lib/supabase/api';

/**
 * 홈 페이지 데이터 로드
 *
 * 성능 최적화:
 * - 게시물은 즉시 로드 (SSR)
 * - 커뮤니티, 알림은 스트리밍으로 처리
 * - 사용자 상호작용(투표/북마크)은 별도 조회 후 병합
 *
 * @param {Function} parent - 부모 레이아웃 데이터
 * @param {Object} locals - 서버 로컬 데이터
 * @returns {Promise<Object>} 홈 페이지 데이터
 */
export const load = async ({ parent, locals: { supabase } }) => {
	const api = create_api(supabase);

	const { user } = await parent();

	// 게시물 로드 (comment count 포함)
	const posts = await api.posts.select_infinite_scroll('', '', 10);

	// 사용자 로그인 시 투표/북마크 데이터 추가
	let posts_with_interactions = posts;

	if (user?.id && posts.length > 0) {
		const [all_votes, all_bookmarks] = await Promise.all([
			api.post_votes.select_by_user_id(user.id),
			api.post_bookmarks.select_by_user_id_lightweight(user.id),
		]);

		// 현재 페이지의 게시물 ID만 필터링
		const post_ids = new Set(posts.map((p) => p.id));
		const votes = all_votes.filter((v) => post_ids.has(v.post_id));
		const bookmarks = all_bookmarks.filter((b) => post_ids.has(b.post_id));

		// 게시물에 사용자 상호작용 데이터 병합
		posts_with_interactions = posts.map((post) => ({
			...post,
			post_votes: votes.filter((v) => v.post_id === post.id),
			post_bookmarks: bookmarks.filter((b) => b.post_id === post.id),
		}));
	}

	// 선택적 데이터: 스트리밍 (Promise 그대로 반환)
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
		posts: posts_with_interactions, // 즉시 반환 (SSR, votes/bookmarks 포함)
		...streamed_data, // Promise 반환 (스트리밍)
	};
};
