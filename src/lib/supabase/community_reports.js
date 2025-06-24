export const create_community_reports_api = (supabase) => ({
	insert: async (data) => {
		const { error } = await supabase.from('community_reports').insert(data);

		if (error) {
			throw new Error(`Failed to insert_community_reports: ${error.message}`);
		}
	},
});
