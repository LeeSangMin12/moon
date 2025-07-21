export const create_moon_charges_api = (supabase) => ({
	// 충전 요청 생성
	create_charge_request: async (charge_data) => {
		const { data, error } = await supabase
			.from('moon_charges')
			.insert({
				user_id: charge_data.user_id,
				point: charge_data.point,
				amount: charge_data.amount,
				bank: charge_data.bank,
				account_number: charge_data.account_number,
				account_holder: charge_data.account_holder,
				status: 'pending', // pending, approved, rejected
			})
			.select()
			.single();

		if (error) {
			throw new Error(`충전 요청 실패: ${error.message}`);
		}

		return data;
	},
	select_recent: async (limit) => {
		const { data, error } = await supabase
			.from('moon_charges')
			.select('*, users(name, handle)')
			.order('created_at', { ascending: false })
			.limit(limit);

		if (error) {
			throw new Error(`최근 충전 요청 조회 실패: ${error.message}`);
		}

		return data || [];
	},
	// 사용자별 충전 요청 조회
	select_by_user_id: async (user_id) => {
		const { data, error } = await supabase
			.from('moon_charges')
			.select('*')
			.eq('user_id', user_id)
			.order('created_at', { ascending: false });

		if (error) {
			throw new Error(`충전 요청 조회 실패: ${error.message}`);
		}

		return data || [];
	},

	// 충전 요청 승인 (관리자용)
	approve_charge_request: async (charge_id) => {
		const { error } = await supabase.rpc('approve_moon_charge', {
			charge_id_in: charge_id,
		});

		if (error) {
			throw new Error(`충전 승인 실패: ${error.message}`);
		}
	},

	// 충전 요청 거절 (관리자용)
	reject_charge_request: async (charge_id, reason = '') => {
		const { error } = await supabase
			.from('moon_charges')
			.update({
				status: 'rejected',
				reject_reason: reason,
				updated_at: new Date(),
			})
			.eq('id', charge_id);

		if (error) {
			throw new Error(`충전 거절 실패: ${error.message}`);
		}
	},

	// 모든 충전 요청 조회 (관리자용)
	select_all_pending: async () => {
		const { data, error } = await supabase
			.from('moon_charges')
			.select('*, users(name, handle)')
			.eq('status', 'pending')
			.order('created_at', { ascending: false });

		if (error) {
			throw new Error(`충전 요청 목록 조회 실패: ${error.message}`);
		}

		return data || [];
	},
});
