export const create_community_members_api = (supabase) => ({
	select_by_user_id: async (user_id) => {
		if (!user_id) return [];

		let { data: community_members, error } = await supabase
			.from('community_members')
			.select('*, communities(*)')
			.eq('user_id', user_id);

		if (error)
			throw new Error(`Failed to select_community_members: ${error.message}`);

		return community_members;
	},
	insert: async (community_id, user_id) => {
		let { error } = await supabase
			.from('community_members')
			.insert({ community_id, user_id });

		if (error) throw new Error(`Failed to insert: ${error.message}`);
	},
	delete: async (community_id, user_id) => {
		let { error } = await supabase
			.from('community_members')
			.delete()
			.eq('community_id', community_id)
			.eq('user_id', user_id);

		if (error) throw new Error(`Failed to delete: ${error.message}`);
	},
});
