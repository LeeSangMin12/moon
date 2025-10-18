export const create_user_coupons_api = (supabase) => ({
	insert: async (data) => {
		const { error } = await supabase.from('user_coupons').insert(data);

		if (error)
			throw new Error(`Failed to insert user_coupon: ${error.message}`);
	},

	select_by_user_id: async (user_id) => {
		const { data, error } = await supabase
			.from('user_coupons')
			.select('*, coupons(*)')
			.eq('user_id', user_id)
			.order('created_at', { ascending: false });

		if (error)
			throw new Error(`Failed to select user_coupons: ${error.message}`);
		return data || [];
	},
});
