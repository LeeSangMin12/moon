/**
 * Post votes API
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase - Supabase client
 * @returns {Object} Post votes API methods
 */
export const create_post_votes_api = (supabase) => ({
	/**
	 * Handles vote (upsert or delete)
	 * @param {string} post_id - Post ID
	 * @param {string} user_id - User ID
	 * @param {number} new_vote - Vote value (1, -1, or 0)
	 */
	handle_vote: async (post_id, user_id, new_vote) => {
		const vote_value = new_vote !== 0 ? new_vote : null;

		const { error } = await supabase.rpc('handle_vote', {
			p_post_id: post_id,
			p_user_id: user_id,
			p_new_vote: vote_value,
		});

		if (error) throw new Error(`Failed to handle_vote: ${error.message}`);
	},

	/**
	 * Gets user's vote for a specific post
	 * @param {string} post_id - Post ID
	 * @param {string} user_id - User ID
	 * @returns {Promise<number>} Vote value (1, -1, or 0)
	 */
	get_user_vote: async (post_id, user_id) => {
		if (!user_id) return 0;

		const { data, error } = await supabase
			.from('post_votes')
			.select('vote')
			.eq('post_id', post_id)
			.eq('user_id', user_id)
			.maybeSingle();

		if (error) {
			throw new Error(`Failed to get_user_vote: ${error.message}`);
		}

		return data?.vote ?? 0;
	},

	/**
	 * Gets all votes for a user (lightweight - only post_id and vote)
	 * @param {string} user_id - User ID
	 * @returns {Promise<Array<{post_id: string, user_id: string, vote: number}>>}
	 */
	select_by_user_id: async (user_id) => {
		if (!user_id) return [];

		const { data, error } = await supabase
			.from('post_votes')
			.select('post_id, user_id, vote')
			.eq('user_id', user_id);

		if (error) {
			throw new Error(`Failed to select_by_user_id: ${error.message}`);
		}

		return data || [];
	},

	/**
	 * Gets votes for a user for specific posts (성능 최적화)
	 * @param {string} user_id - User ID
	 * @param {Array<string|number>} post_ids - Array of post IDs
	 * @returns {Promise<Array<{post_id: string, user_id: string, vote: number}>>}
	 */
	select_by_post_ids: async (user_id, post_ids) => {
		if (!user_id || !post_ids || post_ids.length === 0) return [];

		const { data, error } = await supabase
			.from('post_votes')
			.select('post_id, user_id, vote')
			.eq('user_id', user_id)
			.in('post_id', post_ids);

		if (error) {
			throw new Error(`Failed to select_by_post_ids: ${error.message}`);
		}

		return data || [];
	},
});
