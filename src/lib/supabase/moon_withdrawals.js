export const create_moon_withdrawals_api = (supabase) => ({
	async insert({ user_id, amount, bank, account_number, account_holder }) {
		return await supabase
			.from('moon_withdrawals')
			.insert([{ user_id, amount, bank, account_number, account_holder }]);
	},
	async select_by_user_id(user_id) {
		const { data, error } = await supabase
			.from('moon_withdrawals')
			.select('*')
			.eq('user_id', user_id)
			.order('created_at', { ascending: false });

		if (error)
			throw new Error(`Failed to select moon_withdrawals: ${error.message}`);
		return data[0];
	},

	// 관리자용: 모든 대기중 출금 요청
	async select_all_pending() {
		const { data, error } = await supabase
			.from('moon_withdrawals')
			.select('*, users(id, name, handle)')
			.eq('status', 'pending')
			.order('created_at', { ascending: false });
		if (error)
			throw new Error(`Failed to select pending withdrawals: ${error.message}`);
		return data || [];
	},

	// 관리자용: 최근 처리된 출금 요청 (approved/rejected)
	async select_recent(limit = 30) {
		const { data, error } = await supabase
			.from('moon_withdrawals')
			.select('*, users(id, name, handle)')
			.in('status', ['approved', 'rejected'])
			.order('updated_at', { ascending: false })
			.limit(limit);
		if (error)
			throw new Error(`Failed to select recent withdrawals: ${error.message}`);
		return data || [];
	},

	// 출금 승인 (관리자용)
	async approve(withdrawal_id) {
		const { error } = await supabase
			.from('moon_withdrawals')
			.update({
				status: 'approved',
				updated_at: new Date(),
			})
			.eq('id', withdrawal_id);

		if (error)
			throw new Error(`Failed to approve withdrawal: ${error.message}`);
	},

	// 출금 거절 (관리자용)
	async reject(withdrawal_id, reason = '') {
		// reject_reason 컬럼이 없다면 DB에 추가 필요
		const { error } = await supabase
			.from('moon_withdrawals')
			.update({
				status: 'rejected',
				updated_at: new Date(),
				reject_reason: reason,
			})
			.eq('id', withdrawal_id);

		if (error) throw new Error(`Failed to reject withdrawal: ${error.message}`);
	},
});
