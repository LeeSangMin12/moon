export const create_cash_transactions_api = (supabase) => ({
	/**
	 * 거래 내역 직접 삽입 (잔액 변경 없음, 기록용)
	 */
	async insert({ user_id, amount, type, description }) {
		const { data, error } = await supabase
			.from('cash_transactions')
			.insert({
				user_id,
				amount,
				type,
				description,
			})
			.select()
			.single();

		if (error) {
			throw new Error(`Failed to insert cash transaction: ${error.message}`);
		}
		return data;
	},

	/**
	 * 문캐시 차감 (RPC)
	 */
	async deduct({ user_id, amount, type, reference_type, reference_id, description }) {
		const { data, error } = await supabase.rpc('deduct_cash', {
			p_user_id: user_id,
			p_amount: amount,
			p_type: type,
			p_reference_type: reference_type ?? null,
			p_reference_id: reference_id ?? null,
			p_description: description ?? null,
		});

		if (error) {
			throw new Error(`Failed to deduct cash: ${error.message}`);
		}
		return data;
	},

	/**
	 * 문캐시 적립 (RPC)
	 */
	async add({ user_id, amount, type, reference_type, reference_id, description }) {
		const { data, error } = await supabase.rpc('add_cash', {
			p_user_id: user_id,
			p_amount: amount,
			p_type: type,
			p_reference_type: reference_type ?? null,
			p_reference_id: reference_id ?? null,
			p_description: description ?? null,
		});

		if (error) {
			throw new Error(`Failed to add cash: ${error.message}`);
		}
		return data;
	},

	/**
	 * 사용자의 거래 내역 조회
	 */
	async select_by_user_id(user_id, limit = 50) {
		const { data, error } = await supabase
			.from('cash_transactions')
			.select('*')
			.eq('user_id', user_id)
			.order('created_at', { ascending: false })
			.limit(limit);

		if (error) {
			throw new Error(`Failed to select cash transactions: ${error.message}`);
		}
		return data || [];
	},

	/**
	 * 사용자의 거래 내역 무한 스크롤
	 */
	async select_infinite_scroll(user_id, last_id, limit = 20) {
		let query = supabase
			.from('cash_transactions')
			.select('*')
			.eq('user_id', user_id)
			.order('id', { ascending: false })
			.limit(limit);

		if (last_id) {
			query = query.lt('id', last_id);
		}

		const { data, error } = await query;

		if (error) {
			throw new Error(`Failed to select cash transactions: ${error.message}`);
		}
		return data || [];
	},

	/**
	 * 타입별 거래 내역 조회
	 */
	async select_by_type(user_id, type, limit = 50) {
		const { data, error } = await supabase
			.from('cash_transactions')
			.select('*')
			.eq('user_id', user_id)
			.eq('type', type)
			.order('created_at', { ascending: false })
			.limit(limit);

		if (error) {
			throw new Error(`Failed to select cash transactions by type: ${error.message}`);
		}
		return data || [];
	},
});
