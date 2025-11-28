import { has_invalid_args } from '$lib/utils/common';

export const create_service_orders_api = (supabase) => ({
	// 새 주문 생성
	insert: async (order_data) => {
		const { data, error } = await supabase
			.from('service_orders')
			.insert(order_data)
			.select('id')
			.maybeSingle();

		if (error)
			throw new Error(`Failed to insert service order: ${error.message}`);
		return data;
	},

	// 주문 상태 업데이트
	update: async (id, update_data) => {
		const { data, error } = await supabase
			.from('service_orders')
			.update(update_data)
			.eq('id', id);

		if (error)
			throw new Error(`Failed to update service order: ${error.message}`);
		return data;
	},

	// 모든 주문 조회 (관리자용)
	select_all: async () => {
		const { data, error } = await supabase
			.from('service_orders')
			.select(
				`
				*,
				buyer:buyer_id(id, name, handle, avatar_url),
				seller:seller_id(id, name, handle, avatar_url),
				service:service_id(id, title, price, images)
			`,
			)
			.order('created_at', { ascending: false });

		if (error)
			throw new Error(`Failed to select service orders: ${error.message}`);
		return data;
	},

	// ID로 주문 조회
	select_by_id: async (id) => {
		const { data, error } = await supabase
			.from('service_orders')
			.select(
				`
				*,
				buyer:buyer_id(id, name, handle, avatar_url),
				seller:seller_id(id, name, handle, avatar_url),
				service:service_id(id, title, price, images)
			`,
			)
			.eq('id', id)
			.maybeSingle();

		if (error)
			throw new Error(`Failed to select service order by id: ${error.message}`);
		return data;
	},

	// 구매자 ID로 주문 조회
	select_by_buyer_id: async (buyer_id) => {
		// if (has_invalid_args([buyer_id])) return [];

		const { data, error } = await supabase
			.from('service_orders')
			.select(
				`
				*,
				buyer:buyer_id(id, name, handle, avatar_url),
				seller:seller_id(id, name, handle, avatar_url),
				service:service_id(id, title, price, images)
			`,
			)
			.eq('buyer_id', buyer_id)
			.order('created_at', { ascending: false });

		if (error)
			throw new Error(`Failed to select orders by buyer id: ${error.message}`);
		return data;
	},

	// 판매자 ID로 주문 조회
	select_by_seller_id: async (seller_id) => {
		// if (has_invalid_args([seller_id])) return [];

		const { data, error } = await supabase
			.from('service_orders')
			.select(
				`
				*,
				buyer:buyer_id(id, name, handle, avatar_url),
				seller:seller_id(id, name, handle, avatar_url),
				service:service_id(id, title, price, images)
			`,
			)
			.eq('seller_id', seller_id)
			.order('created_at', { ascending: false });

		if (error)
			throw new Error(`Failed to select orders by seller id: ${error.message}`);
		return data;
	},

	// 서비스 ID로 주문 조회
	select_by_service_id: async (service_id) => {
		// if (has_invalid_args([service_id])) return [];

		const { data, error } = await supabase
			.from('service_orders')
			.select(
				`
				*,
				buyer:buyer_id(id, name, handle, avatar_url),
				seller:seller_id(id, name, handle, avatar_url),
				service:service_id(id, title, price, images)
			`,
			)
			.eq('service_id', service_id)
			.order('created_at', { ascending: false });

		if (error)
			throw new Error(
				`Failed to select orders by service id: ${error.message}`,
			);
		return data;
	},

	// 주문 상태별 조회
	select_by_status: async (status, user_id = null) => {
		let query = supabase
			.from('service_orders')
			.select(
				`
				*,
				buyer:buyer_id(id, name, handle, avatar_url),
				seller:seller_id(id, name, handle, avatar_url),
				service:service_id(id, title, price, images)
			`,
			)
			.eq('status', status)
			.order('created_at', { ascending: false });

		// 특정 사용자의 주문만 조회하는 경우
		if (user_id) {
			query = query.or(`buyer_id.eq.${user_id},seller_id.eq.${user_id}`);
		}

		const { data, error } = await query;

		if (error)
			throw new Error(`Failed to select orders by status: ${error.message}`);
		return data;
	},

	// 주문 승인 (관리자/판매자용)
	approve: async (order_id) => {
		const { error } = await supabase.rpc('approve_service_order', {
			order_id_in: order_id,
		});

		if (error)
			throw new Error(`Failed to approve service order: ${error.message}`);
	},

	// 주문 완료 (판매자용)
	complete: async (order_id) => {
		// 1. 주문 정보 조회
		const { data: order, error: orderError } = await supabase
			.from('service_orders')
			.select('id, seller_id, unit_price, quantity, service_title')
			.eq('id', order_id)
			.single();

		if (orderError || !order) {
			throw new Error('주문을 찾을 수 없습니다.');
		}

		// 2. RPC 호출
		const { error } = await supabase.rpc('complete_service_order', {
			order_id_in: order_id,
		});

		if (error)
			throw new Error(`Failed to complete service order: ${error.message}`);

		// 3. 수수료 계산 (5%)
		const total_amount = order.unit_price * order.quantity;
		const commission_rate = 0.05;
		const commission_amount = Math.floor(total_amount * commission_rate);
		const seller_payout = total_amount - commission_amount;

		// 4. 판매자에게 캐시 적립
		const { error: cashError } = await supabase.rpc('add_cash', {
			p_user_id: order.seller_id,
			p_amount: seller_payout,
			p_type: 'service_payout',
			p_reference_type: 'service_order',
			p_reference_id: order_id,
			p_description: `서비스 판매: ${order.service_title || ''}`,
		});

		if (cashError) {
			console.error('캐시 적립 실패:', cashError);
		}

		// 5. 판매자에게 알림 전송
		await supabase.from('notifications').insert({
			recipient_id: order.seller_id,
			type: 'service_order_completed',
			resource_type: 'service_order',
			resource_id: order_id,
			payload: {
				title: order.service_title,
				payout: seller_payout,
			},
			link_url: `/@me/accounts/orders`,
		});
	},

	// 주문 취소
	cancel: async (order_id, reason = '') => {
		const { error } = await supabase.rpc('cancel_service_order', {
			order_id_in: order_id,
			reason_in: reason,
		});

		if (error)
			throw new Error(`Failed to cancel service order: ${error.message}`);
	},

	// 주문 환불
	refund: async (order_id, reason = '') => {
		const { error } = await supabase.rpc('refund_service_order', {
			order_id_in: order_id,
			reason_in: reason,
		});

		if (error)
			throw new Error(`Failed to refund service order: ${error.message}`);
	},

	// 주문 통계 조회
	select_stats: async (user_id = null) => {
		let query = supabase.from('service_order_stats').select('*');

		if (user_id) {
			query = query.eq('user_id', user_id);
		}

		const { data, error } = await query;

		if (error)
			throw new Error(`Failed to select order stats: ${error.message}`);
		return user_id ? data[0] : data;
	},

	// 최근 주문 조회 (무한 스크롤용)
	select_infinite_scroll: async (last_order_id, limit = 10, user_id = null) => {
		let query = supabase
			.from('service_orders')
			.select(
				`
				id, status, created_at, service_id,
				buyer:buyer_id(id, name, handle, avatar_url),
				seller:seller_id(id, name, handle, avatar_url),
				service:service_id(id, title, price, images)
			`,
			)
			.order('id', { ascending: false })
			.limit(limit);

		if (last_order_id !== '') {
			query = query.lt('id', last_order_id);
		}

		// 특정 사용자의 주문만 조회하는 경우
		if (user_id) {
			query = query.or(`buyer_id.eq.${user_id},seller_id.eq.${user_id}`);
		}

		const { data, error } = await query;

		if (error)
			throw new Error(
				`Failed to select orders with infinite scroll: ${error.message}`,
			);
		return data;
	},

	// 주문 검색
	select_by_search: async (search_text, user_id = null) => {
		let query = supabase
			.from('service_orders')
			.select(
				`
				*,
				buyer:buyer_id(id, name, handle, avatar_url),
				seller:seller_id(id, name, handle, avatar_url),
				service:service_id(id, title, price, images)
			`,
			)
			.ilike('service_title', `%${search_text}%`)
			.order('created_at', { ascending: false });

		// 특정 사용자의 주문만 검색하는 경우
		if (user_id) {
			query = query.or(`buyer_id.eq.${user_id},seller_id.eq.${user_id}`);
		}

		const { data, error } = await query;

		if (error)
			throw new Error(`Failed to search service orders: ${error.message}`);
		return data;
	},
});
