export const create_post_comment_votes_api = (supabase) => ({
	upsert: async (vote_data) => {
		const { data, error } = await supabase
			.from('post_comment_votes')
			.upsert(vote_data, { onConflict: 'user_id, comment_id' })
			.select()
			.single();

		if (error) {
			throw new Error(`댓글 투표 업데이트 실패: ${error.message}`);
		}

		return data;
	},
});
