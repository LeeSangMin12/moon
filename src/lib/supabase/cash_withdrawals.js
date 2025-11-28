export const create_cash_withdrawals_api = (supabase) => ({
	/**
	 * 출금 요청 생성
	 */
	async insert({ user_id, bank_account_id, amount }) {
		const { data, error } = await supabase
			.from('cash_withdrawals')
			.insert([{ user_id, bank_account_id, amount }])
			.select()
			.single();

		if (error) {
			throw new Error(`Failed to create withdrawal request: ${error.message}`);
		}
		return data;
	},

	/**
	 * 사용자의 출금 요청 목록 조회
	 */
	async select_by_user_id(user_id, limit = 20) {
		const { data, error } = await supabase
			.from('cash_withdrawals')
			.select('*, bank_account:bank_account_id(bank, account_number, account_holder)')
			.eq('user_id', user_id)
			.order('created_at', { ascending: false })
			.limit(limit);

		if (error) {
			throw new Error(`Failed to select withdrawal requests: ${error.message}`);
		}
		return data || [];
	},

	/**
	 * 대기중인 출금 요청 조회 (사용자)
	 */
	async select_pending_by_user_id(user_id) {
		const { data, error } = await supabase
			.from('cash_withdrawals')
			.select('*, bank_account:bank_account_id(bank, account_number, account_holder)')
			.eq('user_id', user_id)
			.eq('status', 'pending')
			.order('created_at', { ascending: false });

		if (error) {
			throw new Error(`Failed to select pending withdrawals: ${error.message}`);
		}
		return data || [];
	},

	// ===== 관리자용 =====

	/**
	 * 모든 출금 요청 조회 (관리자용)
	 */
	async select_all(status = null, limit = 50) {
		let query = supabase
			.from('cash_withdrawals')
			.select(`
				*,
				users:user_id(id, name, handle, email),
				bank_account:bank_account_id(bank, account_number, account_holder)
			`)
			.order('created_at', { ascending: false })
			.limit(limit);

		if (status) {
			query = query.eq('status', status);
		}

		const { data, error } = await query;

		if (error) {
			throw new Error(`Failed to select all withdrawals: ${error.message}`);
		}
		return data || [];
	},

	/**
	 * 대기중인 모든 출금 요청 조회 (관리자용)
	 */
	async select_all_pending() {
		const { data, error } = await supabase
			.from('cash_withdrawals')
			.select(`
				*,
				users:user_id(id, name, handle, email),
				bank_account:bank_account_id(bank, account_number, account_holder)
			`)
			.eq('status', 'pending')
			.order('created_at', { ascending: false });

		if (error) {
			throw new Error(`Failed to select all pending withdrawals: ${error.message}`);
		}
		return data || [];
	},

	/**
	 * 출금 승인 (관리자용 - RPC 사용)
	 */
	async approve(withdrawal_id, admin_id) {
		const { data, error } = await supabase.rpc('approve_cash_withdrawal', {
			p_withdrawal_id: withdrawal_id,
			p_admin_id: admin_id,
		});

		if (error) {
			throw new Error(`Failed to approve withdrawal: ${error.message}`);
		}
		return data;
	},

	/**
	 * 출금 거절 (관리자용)
	 */
	async reject(withdrawal_id, admin_id, reject_reason = '') {
		const { error } = await supabase
			.from('cash_withdrawals')
			.update({
				status: 'rejected',
				reject_reason,
				approved_by: admin_id,
				updated_at: new Date().toISOString(),
			})
			.eq('id', withdrawal_id);

		if (error) {
			throw new Error(`Failed to reject withdrawal: ${error.message}`);
		}
	},
});
