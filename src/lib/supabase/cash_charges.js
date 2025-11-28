export const create_cash_charges_api = (supabase) => ({
	/**
	 * 충전 요청 생성
	 */
	async insert({ user_id, amount, depositor_name }) {
		const { data, error } = await supabase
			.from('cash_charges')
			.insert([{ user_id, amount, depositor_name }])
			.select()
			.single();

		if (error) {
			throw new Error(`Failed to create charge request: ${error.message}`);
		}
		return data;
	},

	/**
	 * 사용자의 충전 요청 목록 조회
	 */
	async select_by_user_id(user_id, limit = 20) {
		const { data, error } = await supabase
			.from('cash_charges')
			.select('*')
			.eq('user_id', user_id)
			.order('created_at', { ascending: false })
			.limit(limit);

		if (error) {
			throw new Error(`Failed to select charge requests: ${error.message}`);
		}
		return data || [];
	},

	/**
	 * 대기중인 충전 요청 조회 (사용자)
	 */
	async select_pending_by_user_id(user_id) {
		const { data, error } = await supabase
			.from('cash_charges')
			.select('*')
			.eq('user_id', user_id)
			.eq('status', 'pending')
			.order('created_at', { ascending: false });

		if (error) {
			throw new Error(`Failed to select pending charges: ${error.message}`);
		}
		return data || [];
	},

	// ===== 관리자용 =====

	/**
	 * 모든 충전 요청 조회 (관리자용)
	 */
	async select_all(status = null, limit = 50) {
		let query = supabase
			.from('cash_charges')
			.select('*, users:user_id(id, name, handle, email)')
			.order('created_at', { ascending: false })
			.limit(limit);

		if (status) {
			query = query.eq('status', status);
		}

		const { data, error } = await query;

		if (error) {
			throw new Error(`Failed to select all charges: ${error.message}`);
		}
		return data || [];
	},

	/**
	 * 대기중인 모든 충전 요청 조회 (관리자용)
	 */
	async select_all_pending() {
		const { data, error } = await supabase
			.from('cash_charges')
			.select('*, users:user_id(id, name, handle, email)')
			.eq('status', 'pending')
			.order('created_at', { ascending: false });

		if (error) {
			throw new Error(`Failed to select all pending charges: ${error.message}`);
		}
		return data || [];
	},

	/**
	 * 충전 승인 (관리자용 - RPC 사용)
	 */
	async approve(charge_id, admin_id) {
		const { data, error } = await supabase.rpc('approve_cash_charge', {
			p_charge_id: charge_id,
			p_admin_id: admin_id,
		});

		if (error) {
			throw new Error(`Failed to approve charge: ${error.message}`);
		}
		return data;
	},

	/**
	 * 충전 거절 (관리자용)
	 */
	async reject(charge_id, admin_id, reject_reason = '') {
		const { error } = await supabase
			.from('cash_charges')
			.update({
				status: 'rejected',
				reject_reason,
				approved_by: admin_id,
				updated_at: new Date().toISOString(),
			})
			.eq('id', charge_id);

		if (error) {
			throw new Error(`Failed to reject charge: ${error.message}`);
		}
	},
});
