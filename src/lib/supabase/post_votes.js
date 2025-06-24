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
});
