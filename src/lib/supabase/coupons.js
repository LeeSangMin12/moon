import { comma } from '$lib/utils/common';

export const create_coupons_api = (supabase) => ({
	// 쿠폰 코드로 조회
	select_by_code: async (code) => {
		const { data, error } = await supabase
			.from('coupons')
			.select('*')
			.eq('code', code.toUpperCase().trim())
			.eq('is_active', true)
			.single();

		if (error) return null;
		return data;
	},

	// 쿠폰 검증
	validate_coupon: async (coupon, user_id, coupon_type, amount) => {
		// 1. 타입 체크
		if (coupon.coupon_type !== 'all' && coupon.coupon_type !== coupon_type) {
			return { valid: false, message: '이 쿠폰은 사용할 수 없습니다.' };
		}

		// 2. 유효기간 체크
		const now = new Date();
		if (coupon.valid_from && new Date(coupon.valid_from) > now) {
			return { valid: false, message: '아직 사용할 수 없는 쿠폰입니다.' };
		}
		if (coupon.valid_until && new Date(coupon.valid_until) < now) {
			return { valid: false, message: '만료된 쿠폰입니다.' };
		}

		// 3. 최소 주문 금액 체크
		if (amount < coupon.min_purchase_amount) {
			return {
				valid: false,
				message: `${comma(coupon.min_purchase_amount)}원 이상 구매 시 사용 가능합니다.`,
			};
		}

		// 4. 전체 사용 횟수 체크
		if (
			coupon.max_usage_count &&
			coupon.current_usage_count >= coupon.max_usage_count
		) {
			return { valid: false, message: '사용 가능 횟수가 초과되었습니다.' };
		}

		// 5. 사용자별 사용 횟수 체크
		const { count } = await supabase
			.from('user_coupons')
			.select('*', { count: 'exact', head: true })
			.eq('user_id', user_id)
			.eq('coupon_id', coupon.id);

		if (count >= coupon.max_usage_per_user) {
			return { valid: false, message: '이미 사용한 쿠폰입니다.' };
		}

		return { valid: true };
	},

	// 할인 금액 계산
	calculate_discount: (coupon, amount) => {
		if (coupon.discount_type === 'fixed') {
			return Math.min(coupon.discount_value, amount);
		} else {
			// percentage
			const discount = Math.floor(amount * (coupon.discount_value / 100));
			if (coupon.max_discount_amount) {
				return Math.min(discount, coupon.max_discount_amount);
			}
			return discount;
		}
	},

	// 쿠폰 사용 증가
	increment_usage: async (coupon_id) => {
		const { error } = await supabase.rpc('increment_coupon_usage', {
			coupon_id_param: coupon_id,
		});
		if (error) throw new Error(`Failed to increment coupon usage: ${error.message}`);
	},
});
