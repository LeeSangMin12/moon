export const create_payments_api = (supabase) => ({
	// 새 결제 거래 생성
	insert_transaction: async (transaction_data) => {
		const { data, error } = await supabase
			.from('payment_transactions')
			.insert(transaction_data)
			.select('*')
			.maybeSingle();

		if (error)
			throw new Error(`Failed to insert payment transaction: ${error.message}`);
		return data;
	},

	// ID로 거래 조회
	select_by_id: async (id) => {
		const { data, error } = await supabase
			.from('payment_transactions')
			.select(
				`
				*,
				user:user_id(id, name, handle, avatar_url, email)
			`,
			)
			.eq('id', id)
			.maybeSingle();

		if (error)
			throw new Error(`Failed to select payment transaction by id: ${error.message}`);
		return data;
	},

	// merchant_uid로 거래 조회
	select_by_merchant_uid: async (merchant_uid) => {
		const { data, error } = await supabase
			.from('payment_transactions')
			.select(
				`
				*,
				user:user_id(id, name, handle, avatar_url, email)
			`,
			)
			.eq('merchant_uid', merchant_uid)
			.maybeSingle();

		if (error)
			throw new Error(
				`Failed to select payment transaction by merchant_uid: ${error.message}`,
			);
		return data;
	},

	// imp_uid로 거래 조회
	select_by_imp_uid: async (imp_uid) => {
		const { data, error } = await supabase
			.from('payment_transactions')
			.select(
				`
				*,
				user:user_id(id, name, handle, avatar_url, email)
			`,
			)
			.eq('imp_uid', imp_uid)
			.maybeSingle();

		if (error)
			throw new Error(
				`Failed to select payment transaction by imp_uid: ${error.message}`,
			);
		return data;
	},

	// 사용자 ID로 거래 조회
	select_by_user_id: async (user_id, status = null) => {
		let query = supabase
			.from('payment_transactions')
			.select('*')
			.eq('user_id', user_id)
			.order('created_at', { ascending: false });

		// 상태 필터링
		if (status) {
			query = query.eq('status', status);
		}

		const { data, error } = await query;

		if (error)
			throw new Error(
				`Failed to select payment transactions by user id: ${error.message}`,
			);
		return data;
	},

	// 거래 상태 업데이트
	update_status: async (id, status_data) => {
		const update_payload = {
			...status_data,
			updated_at: new Date().toISOString(),
		};

		const { data, error } = await supabase
			.from('payment_transactions')
			.update(update_payload)
			.eq('id', id)
			.select('*')
			.maybeSingle();

		if (error)
			throw new Error(`Failed to update payment transaction: ${error.message}`);
		return data;
	},

	// merchant_uid로 상태 업데이트
	update_by_merchant_uid: async (merchant_uid, status_data) => {
		const update_payload = {
			...status_data,
			updated_at: new Date().toISOString(),
		};

		const { data, error } = await supabase
			.from('payment_transactions')
			.update(update_payload)
			.eq('merchant_uid', merchant_uid)
			.select('*')
			.maybeSingle();

		if (error)
			throw new Error(`Failed to update payment transaction: ${error.message}`);
		return data;
	},

	// 결제 취소/환불
	cancel_transaction: async (id, cancel_reason) => {
		const cancel_data = {
			status: 'cancelled',
			cancel_reason: cancel_reason,
			cancelled_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		};

		const { data, error } = await supabase
			.from('payment_transactions')
			.update(cancel_data)
			.eq('id', id)
			.select('*')
			.maybeSingle();

		if (error)
			throw new Error(`Failed to cancel payment transaction: ${error.message}`);
		return data;
	},

	// 모든 거래 조회 (관리자용)
	select_all: async (limit = 50) => {
		const { data, error } = await supabase
			.from('payment_transactions')
			.select(
				`
				*,
				user:user_id(id, name, handle, avatar_url, email)
			`,
			)
			.order('created_at', { ascending: false })
			.limit(limit);

		if (error)
			throw new Error(`Failed to select payment transactions: ${error.message}`);
		return data;
	},

	// 상태별 거래 조회
	select_by_status: async (status, user_id = null) => {
		let query = supabase
			.from('payment_transactions')
			.select(
				`
				*,
				user:user_id(id, name, handle, avatar_url, email)
			`,
			)
			.eq('status', status)
			.order('created_at', { ascending: false });

		// 특정 사용자의 거래만 조회
		if (user_id) {
			query = query.eq('user_id', user_id);
		}

		const { data, error } = await query;

		if (error)
			throw new Error(
				`Failed to select payment transactions by status: ${error.message}`,
			);
		return data;
	},

	// 거래 통계 조회
	select_stats: async (user_id = null) => {
		let query = supabase.from('payment_transactions').select('status, amount');

		if (user_id) {
			query = query.eq('user_id', user_id);
		}

		const { data, error } = await query;

		if (error)
			throw new Error(`Failed to select payment stats: ${error.message}`);

		// 통계 계산
		const stats = {
			total_count: data.length,
			completed_count: data.filter((t) => t.status === 'completed').length,
			pending_count: data.filter((t) => t.status === 'pending').length,
			cancelled_count: data.filter((t) => t.status === 'cancelled').length,
			refunded_count: data.filter((t) => t.status === 'refunded').length,
			total_amount: data
				.filter((t) => t.status === 'completed')
				.reduce((sum, t) => sum + t.amount, 0),
		};

		return stats;
	},
});
