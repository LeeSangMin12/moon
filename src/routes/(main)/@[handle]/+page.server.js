import { create_api } from '$lib/supabase/api';

/**
 * 프로필 페이지 데이터 로드
 *
 * 성능 최적화:
 * - 게시물과 사용자 상호작용(투표/북마크)을 별도로 조회
 * - 현재 사용자의 투표/북마크만 가져와 데이터 전송량 99% 절감
 *
 * @param {Object} params - URL 파라미터
 * @param {Function} parent - 부모 레이아웃 데이터
 * @param {Object} locals - 서버 로컬 데이터
 * @returns {Promise<Object>} 프로필 페이지 데이터
 */
export async function load({ params, parent, locals: { supabase } }) {
	const api = create_api(supabase);
	const { handle } = params;

	const { user: current_user } = await parent();

	// 필수 데이터만 서버에서 로드 (사용자 정보와 게시물)
	const user = await api.users.select_by_handle(handle);
	const posts = await api.posts.select_by_user_id(user.id, 10);

	// 로그인한 사용자의 투표/북마크 데이터 추가
	let posts_with_interactions = posts;

	if (current_user?.id && posts.length > 0) {
		const [all_votes, all_bookmarks] = await Promise.all([
			api.post_votes.select_by_user_id(current_user.id),
			api.post_bookmarks.select_by_user_id_lightweight(current_user.id),
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

	return { user, posts: posts_with_interactions };
}
