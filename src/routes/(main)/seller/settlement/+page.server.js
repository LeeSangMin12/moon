import { create_api } from '$lib/supabase/api';
import { redirect, fail } from '@sveltejs/kit';

export const load = async ({ parent, locals: { supabase } }) => {
	const { user } = await parent();

	if (!user) {
		redirect(303, '/login');
	}

	const api = create_api(supabase);

	// 병렬로 데이터 조회
	const [settleable_orders, settlements, pending_settlements] = await Promise.all([
		api.seller_settlements.get_settleable_orders(user.id),
		api.seller_settlements.select_by_seller_id(user.id),
		api.seller_settlements.select_pending_by_seller_id(user.id),
	]);

	// 정산 가능 금액 계산
	const settleable_amount = settleable_orders.reduce((total, order) => {
		const settlement_amount =
			order.total_with_commission + (order.coupon_discount || 0) - order.commission_amount;
		return total + settlement_amount;
	}, 0);

	return {
		settleable_orders,
		settleable_amount,
		settlements,
		has_pending_settlement: pending_settlements.length > 0,
	};
};

export const actions = {
	request_settlement: async ({ request, locals: { supabase, get_user } }) => {
		const user = await get_user();
		if (!user) {
			return fail(401, { message: '로그인이 필요합니다.' });
		}

		const form_data = await request.formData();
		const bank = form_data.get('bank')?.toString().trim();
		const account_number = form_data.get('account_number')?.toString().trim();
		const account_holder = form_data.get('account_holder')?.toString().trim();
		const order_ids_str = form_data.get('order_ids')?.toString();

		// 유효성 검사
		if (!bank || !account_number || !account_holder) {
			return fail(400, { message: '모든 계좌 정보를 입력해주세요.' });
		}

		if (!order_ids_str) {
			return fail(400, { message: '정산할 주문을 선택해주세요.' });
		}

		const order_ids = order_ids_str.split(',').map((id) => parseInt(id, 10));

		if (order_ids.length === 0) {
			return fail(400, { message: '정산할 주문을 선택해주세요.' });
		}

		const api = create_api(supabase);

		// 정산 가능한 주문인지 확인
		const settleable_orders = await api.seller_settlements.get_settleable_orders(user.id);
		const settleable_order_ids = new Set(settleable_orders.map((o) => o.id));

		const invalid_orders = order_ids.filter((id) => !settleable_order_ids.has(id));
		if (invalid_orders.length > 0) {
			return fail(400, { message: '정산할 수 없는 주문이 포함되어 있습니다.' });
		}

		// 정산 금액 계산
		const selected_orders = settleable_orders.filter((o) => order_ids.includes(o.id));
		const amount = selected_orders.reduce((total, order) => {
			const settlement_amount =
				order.total_with_commission + (order.coupon_discount || 0) - order.commission_amount;
			return total + settlement_amount;
		}, 0);

		if (amount <= 0) {
			return fail(400, { message: '정산 금액이 0원 이하입니다.' });
		}

		try {
			await api.seller_settlements.insert({
				seller_id: user.id,
				amount,
				bank,
				account_number,
				account_holder,
				order_ids,
			});

			return { success: true, message: '정산 신청이 완료되었습니다.' };
		} catch (err) {
			console.error('Settlement request error:', err);
			return fail(500, { message: '정산 신청 중 오류가 발생했습니다.' });
		}
	},
};
