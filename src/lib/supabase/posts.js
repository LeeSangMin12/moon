/**
 * Posts API Factory
 *
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase - Supabase 클라이언트 인스턴스
 * @returns {Object} Posts API 메서드 모음
 */
export const create_posts_api = (supabase) => {
	/**
	 * 게시물 목록 조회 시 기본으로 사용하는 필드
	 *
	 * 성능 최적화:
	 * - post_votes, post_bookmarks 제거 (별도 API로 현재 사용자 것만 로드)
	 * - 모든 사용자의 투표/북마크 대신 필요한 것만 가져와 99% 데이터 절감
	 */
	const POST_LIST_FIELDS =
		'id, title, content, created_at, author_id, community_id, like_count, images, ' +
		'users:author_id(id, handle, name, avatar_url), ' +
		'communities(id, title, slug), ' +
		'post_comments(count)';

	/**
	 * 게시물 상세 조회 시 사용하는 필드
	 *
	 * 성능 최적화:
	 * - post_votes, post_bookmarks 제거 (별도 API로 현재 사용자 것만 로드)
	 * - 모든 사용자의 투표/북마크 대신 필요한 것만 가져와 99% 데이터 절감
	 */
	const POST_DETAIL_FIELDS =
		'*, users:author_id(id, handle, name, avatar_url), ' +
		'communities(id, title, slug), ' +
		'post_comments(count)';

	return {
		/**
		 * 게시물 검색 (제목 기준)
		 *
		 * @param {string} search_text - 검색어
		 * @returns {Promise<Object[]>} 검색된 게시물 배열
		 * @throws {Error} 쿼리 실패 시
		 */
		select_by_search: async (search_text) => {
			const { data: posts, error } = await supabase
				.from('posts')
				.select(POST_DETAIL_FIELDS)
				.ilike('title', `%${search_text}%`)
				.order('created_at', { ascending: false });

			if (error)
				throw new Error(`Failed to select_by_search: ${error.message}`);

			return posts || [];
		},

		/**
		 * 무한 스크롤용 게시물 조회
		 *
		 * @param {string|number} last_post_id - 마지막 게시물 ID (페이지네이션 커서)
		 * @param {string} community_id - 커뮤니티 ID (빈 문자열이면 전체)
		 * @param {number} limit - 한 번에 가져올 개수 (기본값: 20)
		 * @returns {Promise<Object[]>} 게시물 배열
		 * @throws {Error} 쿼리 실패 시
		 */
		select_infinite_scroll: async (
			last_post_id,
			community_id,
			limit = 20
		) => {
			let query = supabase
				.from('posts')
				.select(POST_LIST_FIELDS)
				.order('id', { ascending: false })
				.limit(limit);

			if (community_id !== '') {
				query = query.eq('community_id', community_id);
			}

			if (last_post_id !== '') {
				query = query.lt('id', last_post_id);
			}

			const { data: posts, error } = await query;

			if (error)
				throw new Error(`Failed to select_infinite_scroll: ${error.message}`);

			return posts || [];
		},

		/**
		 * ID로 단일 게시물 조회
		 *
		 * @param {string|number} post_id - 게시물 ID
		 * @returns {Promise<Object|null>} 게시물 객체 또는 null
		 * @throws {Error} 쿼리 실패 시
		 */
		select_by_id: async (post_id) => {
			const { data, error } = await supabase
				.from('posts')
				.select(POST_DETAIL_FIELDS)
				.eq('id', post_id)
				.maybeSingle();

			if (error) throw new Error(`Failed to select_by_id: ${error.message}`);

			return data || null;
		},

		/**
		 * 커뮤니티별 게시물 조회
		 *
		 * @param {string} community_id - 커뮤니티 ID
		 * @param {number} limit - 한 번에 가져올 개수 (기본값: 20)
		 * @returns {Promise<Object[]>} 게시물 배열
		 * @throws {Error} 쿼리 실패 시
		 */
		select_by_community_id: async (community_id, limit = 20) => {
			const { data, error } = await supabase
				.from('posts')
				.select(POST_LIST_FIELDS)
				.eq('community_id', community_id)
				.order('id', { ascending: false })
				.limit(limit);

			if (error)
				throw new Error(`Failed to select_by_community_id: ${error.message}`);

			return data || [];
		},

		/**
		 * 사용자별 게시물 조회
		 *
		 * @param {string} user_id - 사용자 ID
		 * @param {number} limit - 한 번에 가져올 개수 (기본값: 20)
		 * @returns {Promise<Object[]>} 게시물 배열
		 * @throws {Error} 쿼리 실패 시
		 */
		select_by_user_id: async (user_id, limit = 20) => {
			const { data, error } = await supabase
				.from('posts')
				.select(POST_LIST_FIELDS)
				.eq('author_id', user_id)
				.order('id', { ascending: false })
				.limit(limit);

			if (error)
				throw new Error(`Failed to select_by_user_id: ${error.message}`);

			return data || [];
		},

		/**
		 * 게시물 생성
		 *
		 * @param {Object} post_data - 게시물 데이터
		 * @returns {Promise<Object>} 생성된 게시물 ID 포함 객체
		 * @throws {Error} 생성 실패 시
		 */
		insert: async (post_data) => {
			const { data, error } = await supabase
				.from('posts')
				.insert(post_data)
				.select('id')
				.maybeSingle();

			if (error) throw new Error(`Failed to insert post: ${error.message}`);

			return data;
		},

		/**
		 * 게시물 업데이트
		 *
		 * @param {string|number} post_id - 게시물 ID
		 * @param {Object} post_data - 업데이트할 데이터
		 * @returns {Promise<Object>} 업데이트된 게시물 객체
		 * @throws {Error} 업데이트 실패 시
		 */
		update: async (post_id, post_data) => {
			const { data, error } = await supabase
				.from('posts')
				.update(post_data)
				.eq('id', post_id)
				.select()
				.maybeSingle();

			if (error) throw new Error(`Failed to update post: ${error.message}`);

			return data;
		},
	};
};
