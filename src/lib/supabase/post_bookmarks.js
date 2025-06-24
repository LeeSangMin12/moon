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
});
