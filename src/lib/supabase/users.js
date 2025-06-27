export const create_users_api = (supabase) => ({
	select: async (user_id, fields = []) => {
		const select_fields = fields.length > 0 ? fields.join(', ') : '*';

		let { data, error } = await supabase
			.from('users')
			.select(select_fields)
			.eq('id', user_id);

		if (error) throw new Error(`Failed to select: ${error.message}`);
		return data?.[0] || null;
	},
	select_handle_check_duplicate: async (handle) => {
		let { data, error } = await supabase
			.from('users')
			.select('handle')
			.eq('handle', handle);

		if (error)
			throw new Error(
				`Failed to select_handle_check_duplicate: ${error.message}`,
			);
		return data?.[0] || null;
	},
	select_by_handle: async (handle) => {
		let { data, error } = await supabase
			.from('users')
			.select('*')
			.eq('handle', handle)
			.single();

		if (error) throw new Error(`Failed to select_by_handle: ${error.message}`);
		return data || null;
	},
	select_by_search: async (search_text) => {
		let { data, error } = await supabase
			.from('users')
			.select('*')
			.or(`handle.ilike.%${search_text}%,name.ilike.%${search_text}%`)
			.order('created_at', { ascending: false });

		if (error) throw new Error(`Failed to select_by_search: ${error.message}`);
		return data || null;
	},
	update: async (user_id, data) => {
		let { error } = await supabase.from('users').update(data).eq('id', user_id);

		if (error) throw new Error(`Failed to update: ${error.message}`);
	},
	gift_moon: async (sender_id, receiver_id, amount) => {
		const { error } = await supabase.rpc('gift_moon', {
			sender_id_in: sender_id,
			receiver_id_in: receiver_id,
			amount_in: amount,
		});

		if (error) {
			throw new Error(`Failed to gift_moon: ${error.message}`);
		}
	},
});
