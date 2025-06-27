export const create_services_api = (supabase) => ({
	select: async () => {
		const { data, error } = await supabase.from('services').select('*');
		if (error) throw new Error(`Failed to select services: ${error.message}`);
		return data;
	},
	select_by_search: async (search_text) => {
		const { data, error } = await supabase
			.from('services')
			.select('*')
			.ilike('title', `%${search_text}%`)
			.order('created_at', { ascending: false });

		if (error) throw new Error(`Failed to select services: ${error.message}`);
		return data;
	},
	select_by_id: async (id) => {
		const { data, error } = await supabase
			.from('services')
			.select('*, users:author_id(id, name, avatar_url)')
			.eq('id', id);

		if (error)
			throw new Error(`Failed to select service by id: ${error.message}`);
		return data[0];
	},
});
