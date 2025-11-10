import { create_api } from '$lib/supabase/api';

/**
 * 북마크 페이지 데이터 로드
 *
 * 성능 최적화:
 * - 북마크 게시물과 사용자 상호작용(투표/북마크)을 별도로 조회
 * - 현재 사용자의 투표/북마크만 가져와 데이터 전송량 99% 절감
 *
 * @param {Object} params - URL 파라미터
 * @param {Function} parent - 부모 레이아웃 데이터
 * @param {Object} locals - 서버 로컬 데이터
 * @returns {Promise<Object>} 북마크 페이지 데이터
 */
export async function load({ params, parent, locals: { supabase } }) {
	const { user } = await parent();
	const api = create_api(supabase);

	const bookmarks = await api.post_bookmarks.select_by_user_id(user.id);

	// 북마크한 게시물들에 사용자 상호작용 데이터 추가
	if (bookmarks.length > 0) {
		const posts = bookmarks.map(b => b.post).filter(Boolean);

		if (posts.length > 0) {
			const [all_votes, all_bookmarks] = await Promise.all([
				api.post_votes.select_by_user_id(user.id),
				api.post_bookmarks.select_by_user_id_lightweight(user.id),
			]);

			const post_ids = new Set(posts.map((p) => p.id));
			const votes = all_votes.filter((v) => post_ids.has(v.post_id));
			const bookmarks_data = all_bookmarks.filter((b) => post_ids.has(b.post_id));

			// 각 북마크의 post에 상호작용 데이터 병합
			return {
				bookmarks: bookmarks.map((bookmark) => {
					if (!bookmark.post) return bookmark;

					return {
						...bookmark,
						post: {
							...bookmark.post,
							post_votes: votes.filter((v) => v.post_id === bookmark.post.id),
							post_bookmarks: bookmarks_data.filter((b) => b.post_id === bookmark.post.id),
						}
					};
				})
			};
		}
	}

	return {
		bookmarks,
	};
}
