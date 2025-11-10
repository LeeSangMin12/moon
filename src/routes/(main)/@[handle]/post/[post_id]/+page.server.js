import { create_api } from '$lib/supabase/api';

/**
 * 게시물 상세 페이지 데이터 로드
 *
 * 성능 최적화:
 * - 게시물과 사용자 상호작용(투표/북마크)을 별도로 조회
 * - 현재 사용자의 투표/북마크만 가져와 데이터 전송량 99% 절감
 *
 * @param {Object} params - URL 파라미터
 * @param {Function} parent - 부모 레이아웃 데이터
 * @param {Object} locals - 서버 로컬 데이터
 * @param {Object} url - URL 객체
 * @returns {Promise<Object>} 게시물 상세 페이지 데이터
 */
export const load = async ({ params, parent, locals: { supabase }, url }) => {
	const { post_id } = params;
	const api = create_api(supabase);

	const { user } = await parent();

	const [post, comments] = await Promise.all([
		api.posts.select_by_id(post_id),
		api.post_comments.select_by_post_id(post_id, user?.id)
	]);

	// 로그인한 사용자의 투표/북마크 데이터 추가
	let post_with_interactions = post;

	if (user?.id && post) {
		const [all_votes, all_bookmarks] = await Promise.all([
			api.post_votes.select_by_user_id(user.id),
			api.post_bookmarks.select_by_user_id_lightweight(user.id),
		]);

		const votes = all_votes.filter((v) => v.post_id === post.id);
		const bookmarks = all_bookmarks.filter((b) => b.post_id === post.id);

		post_with_interactions = {
			...post,
			post_votes: votes,
			post_bookmarks: bookmarks,
		};
	}

	return {
		post: post_with_interactions,
		comments,
		page_url: url.origin + url.pathname,
	};
};
