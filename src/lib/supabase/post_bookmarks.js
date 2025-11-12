/**
 * Post bookmarks API
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase - Supabase client
 * @returns {Object} Post bookmarks API methods
 */
export const create_post_bookmarks_api = (supabase) => ({
	/**
	 * Adds a bookmark
	 * @param {string} post_id - Post ID
	 * @param {string} user_id - User ID
	 */
	insert: async (post_id, user_id) => {
		const { error } = await supabase
			.from('post_bookmarks')
			.insert({ post_id, user_id });

		if (error && error.code !== '23505') {
			throw new Error(`Failed to insert: ${error.message}`);
		}
	},

	/**
	 * Removes a bookmark
	 * @param {string} post_id - Post ID
	 * @param {string} user_id - User ID
	 */
	delete: async (post_id, user_id) => {
		const { error } = await supabase
			.from('post_bookmarks')
			.delete()
			.eq('post_id', post_id)
			.eq('user_id', user_id);

		if (error) throw new Error(`Failed to delete: ${error.message}`);
	},

	/**
	 * Gets all bookmarks for a user with full post details (for bookmark page)
	 *
	 * 성능 최적화:
	 * - post_votes, post_bookmarks 제거 (별도 API로 현재 사용자 것만 로드)
	 * - 모든 사용자의 투표/북마크 대신 필요한 것만 가져와 99% 데이터 절감
	 *
	 * @param {string} user_id - User ID
	 * @returns {Promise<Array>} Array of bookmarks with full post data
	 */
	select_by_user_id: async (user_id) => {
		const { data, error} = await supabase
			.from('post_bookmarks')
			.select(
				`
				*,
				post:post_id (
					id,
					title,
					content,
					images,
					like_count,
					created_at,
					users:author_id(id, handle, name, avatar_url),
					communities:community_id(id, title, slug),
					post_comments(count)
				)
			`,
			)
			.eq('user_id', user_id)
			.order('created_at', { ascending: false });

		if (error) throw new Error(`Failed to select bookmarks: ${error.message}`);
		return data;
	},

	/**
	 * Gets all bookmarks for a user (lightweight - only post_id)
	 * @param {string} user_id - User ID
	 * @returns {Promise<Array<{post_id: string, user_id: string}>>}
	 */
	select_by_user_id_lightweight: async (user_id) => {
		if (!user_id) return [];

		const { data, error } = await supabase
			.from('post_bookmarks')
			.select('post_id, user_id')
			.eq('user_id', user_id);

		if (error) {
			throw new Error(`Failed to select_by_user_id_lightweight: ${error.message}`);
		}

		return data || [];
	},

	/**
	 * Gets bookmarks for a user for specific posts (성능 최적화)
	 * @param {string} user_id - User ID
	 * @param {Array<string|number>} post_ids - Array of post IDs
	 * @returns {Promise<Array<{post_id: string, user_id: string}>>}
	 */
	select_by_post_ids: async (user_id, post_ids) => {
		if (!user_id || !post_ids || post_ids.length === 0) return [];

		const { data, error } = await supabase
			.from('post_bookmarks')
			.select('post_id, user_id')
			.eq('user_id', user_id)
			.in('post_id', post_ids);

		if (error) {
			throw new Error(`Failed to select_by_post_ids: ${error.message}`);
		}

		return data || [];
	},
});
