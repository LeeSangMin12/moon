export const create_post_reports_api = (supabase) => ({
	insert: async (data) => {
		const { error } = await supabase.from('post_reports').insert(data);

		if (error) {
			throw new Error(`Failed to insert_post_reports: ${error.message}`);
		}
	},
});
