export const create_post_votes_api = (supabase) => ({
	handle_vote: async (post_id, user_id, new_vote) => {
		const vote_value = new_vote !== 0 ? new_vote : null;

		const { error } = await supabase.rpc('handle_vote', {
			p_post_id: post_id,
			p_user_id: user_id,
			p_new_vote: vote_value,
		});

		if (error) throw new Error(`Failed to handle_vote: ${error.message}`);
	},
	
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

		// If no vote record exists, return 0 (neutral)
		return data?.vote ?? 0;
	},
});
