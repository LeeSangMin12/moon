export const create_user_reports_api = (supabase) => ({
	insert: async (data) => {
		const { error } = await supabase.from('user_reports').insert(data);

		if (error) {
			throw new Error(`Failed to insert_community_reports: ${error.message}`);
		}
	},
});
