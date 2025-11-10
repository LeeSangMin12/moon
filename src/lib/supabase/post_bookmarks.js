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
					created_at,
					users:author_id(id, handle, name, avatar_url),
					communities:community_id(id, title, slug),
					post_votes(user_id, vote),
					post_bookmarks(user_id),
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
});
