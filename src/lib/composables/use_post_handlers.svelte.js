/**
 * Post 상호작용(북마크, 좋아요, 싫어요) 핸들러 Composable
 *
 * 여러 페이지에서 공통으로 사용하는 Post 이벤트 핸들러를 제공합니다.
 * 각 페이지의 데이터 구조에 맞게 getter/setter를 제공하면 됩니다.
 *
 * @param {Function} get_posts - posts 배열을 반환하는 getter 함수
 * @param {Function} set_posts - posts 배열을 업데이트하는 setter 함수
 * @param {Object} me - 현재 사용자 객체 (user_id 필요)
 * @returns {Object} { handle_bookmark_changed, handle_vote_changed }
 *
 * @example
 * // 기본 사용법
 * const { handle_bookmark_changed, handle_vote_changed } = create_post_handlers(
 *   () => posts,           // getter
 *   (val) => posts = val,  // setter
 *   me
 * );
 *
 * @example
 * // 캐시도 함께 업데이트하는 경우
 * const { handle_bookmark_changed, handle_vote_changed } = create_post_handlers(
 *   () => posts,
 *   (val) => {
 *     posts = val;
 *     updateCache(val);  // 추가 로직
 *   },
 *   me
 * );
 */
export function create_post_handlers(get_posts, set_posts, me) {
	/**
	 * 북마크 변경 콜백 핸들러
	 * Post 컴포넌트에서 북마크 상태가 변경되면 posts 배열 업데이트
	 */
	const handle_bookmark_changed = (data) => {
		const { post_id, bookmarks } = data;
		const posts = get_posts();

		// posts 배열에서 해당 post 찾아서 업데이트
		const updated_posts = posts.map((p) =>
			p.id === post_id ? { ...p, post_bookmarks: bookmarks } : p
		);

		set_posts(updated_posts);
	};

	/**
	 * 투표 변경 콜백 핸들러
	 * Post 컴포넌트에서 좋아요/싫어요 상태가 변경되면 posts 배열 업데이트
	 */
	const handle_vote_changed = (data) => {
		const { post_id, user_vote, like_count } = data;
		const posts = get_posts();

		// posts 배열에서 해당 post 찾아서 업데이트
		const updated_posts = posts.map((p) => {
			if (p.id !== post_id) return p;

			// post_votes 배열 업데이트
			let updated_votes = p.post_votes || [];
			const existing_vote_index = updated_votes.findIndex(
				(v) => v.user_id === me.id
			);

			if (user_vote === 0) {
				// 투표 취소
				updated_votes = updated_votes.filter((v) => v.user_id !== me.id);
			} else if (existing_vote_index >= 0) {
				// 기존 투표 업데이트
				updated_votes[existing_vote_index] = {
					user_id: me.id,
					vote: user_vote,
				};
			} else {
				// 새 투표 추가
				updated_votes = [...updated_votes, { user_id: me.id, vote: user_vote }];
			}

			return {
				...p,
				post_votes: updated_votes,
				like_count: like_count,
			};
		});

		set_posts(updated_posts);
	};

	return {
		handle_bookmark_changed,
		handle_vote_changed,
	};
}
