import { has_invalid_args } from '$lib/js/common';

export const create_service_reviews_api = (supabase) => ({
	// 리뷰 생성
	insert: async (review_data) => {
		const { data, error } = await supabase
			.from('service_reviews')
			.insert(review_data)
			.select('id')
			.maybeSingle();

		if (error)
			throw new Error(`Failed to insert service review: ${error.message}`);
		return data;
	},

	// 리뷰 업데이트
	update: async (id, update_data) => {
		const { data, error } = await supabase
			.from('service_reviews')
			.update(update_data)
			.eq('id', id);

		if (error)
			throw new Error(`Failed to update service review: ${error.message}`);
		return data;
	},

	// 리뷰 삭제
	delete: async (id) => {
		const { error } = await supabase
			.from('service_reviews')
			.delete()
			.eq('id', id);

		if (error)
			throw new Error(`Failed to delete service review: ${error.message}`);
	},

	// ID로 리뷰 조회
	select_by_id: async (id) => {
		const { data, error } = await supabase
			.from('service_reviews')
			.select(
				`
				*,
				reviewer:reviewer_id(id, name, handle, avatar_url),
				service:service_id(id, title),
				order:order_id(id, status)
			`,
			)
			.eq('id', id)
			.maybeSingle();

		if (error)
			throw new Error(
				`Failed to select service review by id: ${error.message}`,
			);
		return data;
	},

	// 서비스별 리뷰 조회
	select_by_service_id: async (service_id) => {
		const { data, error } = await supabase
			.from('service_reviews')
			.select(`*, reviewer:reviewer_id(id, name, handle, avatar_url)`)
			.eq('service_id', service_id)
			.order('created_at', { ascending: false });

		if (error)
			throw new Error(
				`Failed to select reviews by service id: ${error.message}`,
			);

		return data;
	},

	// 리뷰어별 리뷰 조회 (사용자가 작성한 리뷰)
	select_by_reviewer_id: async (reviewer_id) => {
		// if (has_invalid_args([reviewer_id])) return [];

		const { data, error } = await supabase
			.from('service_reviews')
			.select(
				`
				*,
				service:service_id(id, title, images),
				order:order_id(id, status)
			`,
			)
			.eq('reviewer_id', reviewer_id)
			.order('created_at', { ascending: false });

		if (error)
			throw new Error(
				`Failed to select reviews by reviewer id: ${error.message}`,
			);
		return data;
	},

	// 서비스 작성자별 받은 리뷰 조회 (서비스 작성자가 받은 리뷰)
	select_by_service_author_id: async (author_id) => {
		// 1. 먼저 해당 사용자의 서비스 ID들을 가져옴
		const { data: services, error: serviceError } = await supabase
			.from('services')
			.select('id')
			.eq('author_id', author_id);

		if (serviceError)
			throw new Error(
				`Failed to select services by author id: ${serviceError.message}`,
			);

		if (!services || services.length === 0) {
			return [];
		}

		const serviceIds = services.map((service) => service.id);

		// 2. 해당 서비스들에 대한 리뷰를 가져옴
		const { data, error } = await supabase
			.from('service_reviews')
			.select(
				`
				*,
				reviewer:reviewer_id(id, name, handle, avatar_url),
				service:service_id(id, title)
			`,
			)
			.in('service_id', serviceIds)
			.order('created_at', { ascending: false });

		if (error)
			throw new Error(
				`Failed to select reviews by service author id: ${error.message}`,
			);
		return data;
	},

	// 특정 사용자가 특정 서비스에 대해 작성한 리뷰 조회
	select_by_service_and_reviewer: async (service_id, reviewer_id) => {
		const { data, error } = await supabase
			.from('service_reviews')
			.select(
				`
				*,
				reviewer:reviewer_id(id, name, handle, avatar_url),
				service:service_id(id, title),
				order:order_id(id, status)
			`,
			)
			.eq('service_id', service_id)
			.eq('reviewer_id', reviewer_id)
			.maybeSingle();

		if (error && error.code !== 'PGRST116') {
			throw new Error(
				`Failed to select review by service and reviewer: ${error.message}`,
			);
		}
		return data;
	},

	// 주문별 리뷰 조회
	select_by_order_id: async (order_id) => {
		// if (has_invalid_args([order_id])) return null;

		const { data, error } = await supabase
			.from('service_reviews')
			.select(
				`
				*,
				reviewer:reviewer_id(id, name, handle, avatar_url),
				service:service_id(id, title)
			`,
			)
			.eq('order_id', order_id)
			.maybeSingle();

		if (error && error.code !== 'PGRST116') {
			throw new Error(`Failed to select review by order id: ${error.message}`);
		}
		return data;
	},

	// 평점별 리뷰 조회
	select_by_rating: async (service_id, rating) => {
		// if (has_invalid_args([service_id, rating])) return [];

		const { data, error } = await supabase
			.from('service_reviews')
			.select(
				`
				*,
				reviewer:reviewer_id(id, name, handle, avatar_url)
			`,
			)
			.eq('service_id', service_id)
			.eq('rating', rating)
			.order('created_at', { ascending: false });

		if (error)
			throw new Error(`Failed to select reviews by rating: ${error.message}`);
		return data;
	},

	// 서비스 리뷰 통계 조회
	select_stats: async (service_id) => {
		// if (has_invalid_args([service_id])) return null;

		const { data, error } = await supabase
			.from('service_review_stats')
			.select('*')
			.eq('service_id', service_id)
			.maybeSingle();

		if (error)
			throw new Error(`Failed to select review stats: ${error.message}`);
		return data;
	},

	// 최근 리뷰 조회 (무한 스크롤용)
	select_infinite_scroll: async (service_id, last_review_id, limit = 10) => {
		let query = supabase
			.from('service_reviews')
			.select(
				`
				*,
				reviewer:reviewer_id(id, name, handle, avatar_url)
			`,
			)
			.eq('service_id', service_id)
			.order('created_at', { ascending: false })
			.limit(limit);

		if (last_review_id !== '') {
			query = query.lt('id', last_review_id);
		}

		const { data, error } = await query;

		if (error)
			throw new Error(
				`Failed to select reviews with infinite scroll: ${error.message}`,
			);
		return data;
	},

	// 리뷰 검색
	select_by_search: async (service_id, search_text) => {
		const { data, error } = await supabase
			.from('service_reviews')
			.select(
				`
				*,
				reviewer:reviewer_id(id, name, handle, avatar_url)
			`,
			)
			.eq('service_id', service_id)
			.or(`title.ilike.%${search_text}%,content.ilike.%${search_text}%`)
			.order('created_at', { ascending: false });

		if (error)
			throw new Error(`Failed to search service reviews: ${error.message}`);
		return data;
	},

	// 서비스 평점 수동 업데이트 (관리자용)
	update_service_rating: async (service_id) => {
		const { error } = await supabase.rpc('update_service_rating', {
			service_id_in: service_id,
		});

		if (error)
			throw new Error(`Failed to update service rating: ${error.message}`);
	},

	// 리뷰 작성 가능 여부 확인 (완료된 주문이 있는지 확인)
	can_write_review: async (service_id, user_id) => {
		// 해당 서비스에 대해 완료된 주문이 있는지 확인 (가장 최근 주문)
		const { data: orders, error: orderError } = await supabase
			.from('service_orders')
			.select('id, created_at')
			.eq('service_id', service_id)
			.eq('buyer_id', user_id)
			.eq('status', 'completed')
			.order('created_at', { ascending: false });

		if (orderError) {
			console.error('주문 확인 실패:', orderError);
			return { can_write: false, order_id: null };
		}

		// 완료된 주문이 없으면 리뷰 작성 불가
		if (!orders || orders.length === 0) {
			return { can_write: false, order_id: null };
		}

		// 이미 리뷰를 작성했는지 확인
		const { data: existingReview, error: reviewError } = await supabase
			.from('service_reviews')
			.select('id')
			.eq('service_id', service_id)
			.eq('reviewer_id', user_id)
			.maybeSingle();

		if (reviewError && reviewError.code !== 'PGRST116') {
			console.error('리뷰 확인 실패:', reviewError);
			return { can_write: false, order_id: null };
		}

		// 이미 리뷰를 작성했으면 새로 작성 불가, 하지만 수정은 가능 (order_id는 반환)
		const can_write = !existingReview;
		const order_id = orders[0].id; // 가장 최근 완료된 주문 (수정 시에도 필요)

		return { can_write, order_id };
	},
});
