export const create_seller_settlements_api = (supabase) => ({
	/**
	 * 정산 신청 생성
	 * @param {Object} data - 정산 신청 데이터
	 * @param {string} data.seller_id - 판매자 ID
	 * @param {number} data.amount - 정산 금액
	 * @param {string} data.bank - 은행
	 * @param {string} data.account_number - 계좌번호
	 * @param {string} data.account_holder - 예금주
	 * @param {number[]} data.order_ids - 정산에 포함할 주문 ID 배열
	 */
	async insert({ seller_id, amount, bank, account_number, account_holder, order_ids }) {
		// 정산 신청 생성
		const { data: settlement, error: settlementError } = await supabase
			.from('seller_settlements')
			.insert([{ seller_id, amount, bank, account_number, account_holder }])
			.select()
			.single();

		if (settlementError) {
			throw new Error(`Failed to create settlement: ${settlementError.message}`);
		}

		// 주문-정산 매핑 생성
		if (order_ids && order_ids.length > 0) {
			const settlement_orders = order_ids.map((order_id) => ({
				settlement_id: settlement.id,
				order_id,
			}));

			const { error: mappingError } = await supabase
				.from('settlement_orders')
				.insert(settlement_orders);

			if (mappingError) {
				throw new Error(`Failed to create settlement_orders: ${mappingError.message}`);
			}
		}

		return settlement;
	},

	/**
	 * 판매자의 정산 내역 조회
	 */
	async select_by_seller_id(seller_id) {
		const { data, error } = await supabase
			.from('seller_settlements')
			.select('*')
			.eq('seller_id', seller_id)
			.order('created_at', { ascending: false });

		if (error) {
			throw new Error(`Failed to select seller_settlements: ${error.message}`);
		}
		return data || [];
	},

	/**
	 * 판매자의 대기중 정산 조회
	 */
	async select_pending_by_seller_id(seller_id) {
		const { data, error } = await supabase
			.from('seller_settlements')
			.select('*')
			.eq('seller_id', seller_id)
			.eq('status', 'pending')
			.order('created_at', { ascending: false });

		if (error) {
			throw new Error(`Failed to select pending settlements: ${error.message}`);
		}
		return data || [];
	},

	/**
	 * 정산 가능한 주문 조회 (completed + 아직 정산 안된 주문)
	 */
	async get_settleable_orders(seller_id) {
		// completed 상태이면서 settlement_orders에 없는 주문 조회
		const { data, error } = await supabase
			.from('service_orders')
			.select(`
				id,
				service_title,
				total_with_commission,
				commission_amount,
				coupon_discount,
				completed_at,
				buyer:users!service_orders_buyer_id_fkey(id, name, handle)
			`)
			.eq('seller_id', seller_id)
			.eq('status', 'completed')
			.order('completed_at', { ascending: false });

		if (error) {
			throw new Error(`Failed to get settleable orders: ${error.message}`);
		}

		// settlement_orders에 이미 등록된 주문 ID 조회
		const { data: settledOrders, error: settledError } = await supabase
			.from('settlement_orders')
			.select('order_id');

		if (settledError) {
			throw new Error(`Failed to get settled orders: ${settledError.message}`);
		}

		const settledOrderIds = new Set(settledOrders?.map((so) => so.order_id) || []);

		// 아직 정산되지 않은 주문만 필터링
		return (data || []).filter((order) => !settledOrderIds.has(order.id));
	},

	/**
	 * 정산 가능 금액 조회
	 */
	async get_settleable_amount(seller_id) {
		const orders = await this.get_settleable_orders(seller_id);
		return orders.reduce((total, order) => {
			const settlement_amount =
				order.total_with_commission + (order.coupon_discount || 0) - order.commission_amount;
			return total + settlement_amount;
		}, 0);
	},

	// ===== 관리자용 =====

	/**
	 * 모든 대기중 정산 요청 조회 (관리자용)
	 */
	async select_all_pending() {
		const { data, error } = await supabase
			.from('seller_settlements')
			.select('*, users:seller_id(id, name, handle, email)')
			.eq('status', 'pending')
			.order('created_at', { ascending: false });

		if (error) {
			throw new Error(`Failed to select all pending settlements: ${error.message}`);
		}
		return data || [];
	},

	/**
	 * 모든 정산 요청 조회 (관리자용)
	 */
	async select_all(status = null, limit = 50) {
		let query = supabase
			.from('seller_settlements')
			.select('*, users:seller_id(id, name, handle, email)')
			.order('created_at', { ascending: false })
			.limit(limit);

		if (status) {
			query = query.eq('status', status);
		}

		const { data, error } = await query;

		if (error) {
			throw new Error(`Failed to select all settlements: ${error.message}`);
		}
		return data || [];
	},

	/**
	 * 정산 승인 (관리자용)
	 */
	async approve(settlement_id) {
		const { error } = await supabase
			.from('seller_settlements')
			.update({
				status: 'approved',
				updated_at: new Date().toISOString(),
				processed_at: new Date().toISOString(),
			})
			.eq('id', settlement_id);

		if (error) {
			throw new Error(`Failed to approve settlement: ${error.message}`);
		}
	},

	/**
	 * 정산 거절 (관리자용)
	 */
	async reject(settlement_id, reason = '') {
		const { error } = await supabase
			.from('seller_settlements')
			.update({
				status: 'rejected',
				reject_reason: reason,
				updated_at: new Date().toISOString(),
				processed_at: new Date().toISOString(),
			})
			.eq('id', settlement_id);

		if (error) {
			throw new Error(`Failed to reject settlement: ${error.message}`);
		}
	},

	/**
	 * 정산에 포함된 주문 조회
	 */
	async get_settlement_orders(settlement_id) {
		const { data, error } = await supabase
			.from('settlement_orders')
			.select(`
				order_id,
				service_orders(
					id,
					service_title,
					total_with_commission,
					commission_amount,
					coupon_discount,
					completed_at
				)
			`)
			.eq('settlement_id', settlement_id);

		if (error) {
			throw new Error(`Failed to get settlement orders: ${error.message}`);
		}
		return data?.map((so) => so.service_orders) || [];
	},
});
