export const create_service_options_api = (supabase) => ({
	// 옵션 추가
	insert: async (option_data) => {
		const { data, error } = await supabase
			.from('service_options')
			.insert(option_data)
			.select('id')
			.maybeSingle();

		if (error)
			throw new Error(`Failed to insert service option: ${error.message}`);
		return data;
	},

	// 여러 옵션 한 번에 추가
	insert_bulk: async (options_data) => {
		const { data, error } = await supabase
			.from('service_options')
			.insert(options_data)
			.select();

		if (error)
			throw new Error(`Failed to insert service options: ${error.message}`);
		return data;
	},

	// 옵션 수정
	update: async (id, option_data) => {
		const { data, error } = await supabase
			.from('service_options')
			.update(option_data)
			.eq('id', id);

		if (error)
			throw new Error(`Failed to update service option: ${error.message}`);
		return data;
	},

	// 옵션 삭제
	delete: async (id) => {
		const { error } = await supabase
			.from('service_options')
			.delete()
			.eq('id', id);

		if (error)
			throw new Error(`Failed to delete service option: ${error.message}`);
	},

	// 서비스별 옵션 조회
	select_by_service_id: async (service_id) => {
		const { data, error } = await supabase
			.from('service_options')
			.select('*')
			.eq('service_id', service_id)
			.order('display_order', { ascending: true });

		if (error)
			throw new Error(
				`Failed to select service options by service_id: ${error.message}`,
			);
		return data || [];
	},

	// 서비스의 모든 옵션 삭제
	delete_by_service_id: async (service_id) => {
		const { error } = await supabase
			.from('service_options')
			.delete()
			.eq('service_id', service_id);

		if (error)
			throw new Error(
				`Failed to delete service options by service_id: ${error.message}`,
			);
	},
});
