export const create_services_api = (supabase) => ({
	insert: async (service) => {
		const { data, error } = await supabase
			.from('services')
			.insert(service)
			.select('id')
			.maybeSingle();

		if (error) throw new Error(`Failed to insert service: ${error.message}`);
		return data;
	},
	update: async (id, service) => {
		const { data, error } = await supabase
			.from('services')
			.update(service)
			.eq('id', id);
		if (error) throw new Error(`Failed to update service: ${error.message}`);
		return data;
	},

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
	select_infinite_scroll: async (last_service_id) => {
		let query = supabase
			.from('services')
			.select('*')
			.order('created_at', { ascending: false }) // 최신순 정렬
			.limit(10);

		if (last_service_id !== '') {
			query.lt('id', last_service_id);
		}

		let { data: services, error } = await query;

		if (error) throw new Error(`Failed to select_services: ${error.message}`);

		return services;
	},
	select_by_id: async (id) => {
		const { data, error } = await supabase
			.from('services')
			.select('*, users:author_id(id, name, avatar_url, handle)')
			.eq('id', id);

		if (error)
			throw new Error(`Failed to select service by id: ${error.message}`);
		return data[0];
	},
});
