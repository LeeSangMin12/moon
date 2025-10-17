export const create_order_options_api = (supabase) => ({
	// 주문에 선택된 옵션 저장 (여러 개)
	insert_bulk: async (order_options_data) => {
		if (!order_options_data || order_options_data.length === 0) {
			return [];
		}

		const { data, error } = await supabase
			.from('order_options')
			.insert(order_options_data)
			.select();

		if (error)
			throw new Error(`Failed to insert order options: ${error.message}`);
		return data;
	},

	// 주문별 옵션 조회
	select_by_order_id: async (order_id) => {
		const { data, error } = await supabase
			.from('order_options')
			.select('*')
			.eq('order_id', order_id);

		if (error)
			throw new Error(
				`Failed to select order options by order_id: ${error.message}`,
			);
		return data || [];
	},
});
