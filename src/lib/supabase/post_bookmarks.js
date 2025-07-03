export const create_post_bookmarks_api = (supabase) => ({
	insert: async (post_id, user_id) => {
		const { error } = await supabase
			.from('post_bookmarks')
			.insert({ post_id, user_id });

		if (error) throw new Error(`Failed to insert: ${error.message}`);
	},
	delete: async (post_id, user_id) => {
		const { error } = await supabase
			.from('post_bookmarks')
			.delete()
			.eq('post_id', post_id)
			.eq('user_id', user_id);

		if (error) throw new Error(`Failed to delete: ${error.message}`);
	},
	select_by_user_id: async (user_id) => {
		const { data, error } = await supabase
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
});
