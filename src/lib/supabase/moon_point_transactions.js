export const create_moon_point_transactions_api = (supabase) => ({
	/**
	 * 문 포인트 트랜잭션 기록 (RPC 방식)
	 * @param {Object} params
	 * @param {string} params.user_id
	 * @param {number} params.amount
	 * @param {string} params.type
	 * @param {string} [params.description]
	 * @returns {Promise<{error: any, data: any}>}
	 */
	async insert({ user_id, amount, type, description }) {
		const { data, error } = await supabase.rpc(
			'insert_moon_point_transaction',
			{
				p_user_id: user_id,
				p_amount: amount,
				p_type: type,
				p_description: description ?? null,
			},
		);

		console.log(data, error);
		return { data, error };
	},

	select_by_user_id: async (user_id) => {
		const { data, error } = await supabase
			.from('moon_point_transactions')
			.select('*')
			.eq('user_id', user_id)
			.order('created_at', { ascending: false });

		if (error) throw new Error(`Failed to select bookmarks: ${error.message}`);
		return data;
	},

	// 잔액/내역 조회 함수는 기존과 동일하게 사용 가능
});
