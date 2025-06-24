export const create_community_topics_api = (supabase) => ({
	insert: async (community_id, selected_topics) => {
		const rows_to_insert = selected_topics.map((topic) => ({
			community_id: community_id,
			topic_id: topic.id,
		}));

		const { error } = await supabase
			.from('community_topics')
			.insert(rows_to_insert);

		if (error) {
			throw new Error(`Failed to insert_community_topics: ${error.message}`);
		}
	},
	delete_by_community_id: async (community_id) => {
		const { error } = await supabase
			.from('community_topics')
			.delete()
			.eq('community_id', community_id);

		if (error) {
			throw new Error(`Failed to delete_community_topics: ${error.message}`);
		}
	},
});
