export const create_topics_api = (supabase) => ({
	select_topic_categories_with_topics: async () => {
		const { data, error } = await supabase
			.from('topic_categories')
			.select('*, topics(id, name)');

		if (error) {
			throw new Error(
				`Failed to select_topic_categories_with_topics: ${error.message}`,
			);
		}
		return data || [];
	},
});
