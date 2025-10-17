export const create_expert_request_reviews_api = (supabase) => ({
	// 리뷰 생성
	insert: async (review_data) => {
		const { data, error } = await supabase
			.from('expert_request_reviews')
			.insert(review_data)
			.select('id')
			.maybeSingle();

		if (error)
			throw new Error(
				`Failed to insert expert request review: ${error.message}`,
			);
		return data;
	},

	// 리뷰 업데이트
	update: async (id, update_data) => {
		const { data, error } = await supabase
			.from('expert_request_reviews')
			.update(update_data)
			.eq('id', id);

		if (error)
			throw new Error(
				`Failed to update expert request review: ${error.message}`,
			);
		return data;
	},

	// 리뷰 삭제
	delete: async (id) => {
		const { error } = await supabase
			.from('expert_request_reviews')
			.delete()
			.eq('id', id);

		if (error)
			throw new Error(
				`Failed to delete expert request review: ${error.message}`,
			);
	},

	// ID로 리뷰 조회
	select_by_id: async (id) => {
		const { data, error } = await supabase
			.from('expert_request_reviews')
			.select(
				`
				*,
				reviewer:reviewer_id(id, name, handle, avatar_url),
				expert:expert_id(id, name, handle, avatar_url),
				request:request_id(id, title),
				proposal:proposal_id(id, message)
			`,
			)
			.eq('id', id)
			.maybeSingle();

		if (error)
			throw new Error(
				`Failed to select expert request review by id: ${error.message}`,
			);
		return data;
	},

	// 전문가 요청별 리뷰 조회
	select_by_request_id: async (request_id) => {
		const { data, error } = await supabase
			.from('expert_request_reviews')
			.select(`*, reviewer:reviewer_id(id, name, handle, avatar_url), expert:expert_id(id, name, handle, avatar_url)`)
			.eq('request_id', request_id)
			.order('created_at', { ascending: false });

		if (error)
			throw new Error(
				`Failed to select reviews by request id: ${error.message}`,
			);

		return data;
	},

	// 리뷰어별 리뷰 조회 (사용자가 작성한 리뷰)
	select_by_reviewer_id: async (reviewer_id) => {
		const { data, error } = await supabase
			.from('expert_request_reviews')
			.select(
				`
				*,
				expert:expert_id(id, name, handle, avatar_url),
				request:request_id(id, title)
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

	// 전문가별 받은 리뷰 조회
	select_by_expert_id: async (expert_id) => {
		const { data, error } = await supabase
			.from('expert_request_reviews')
			.select(
				`
				*,
				reviewer:reviewer_id(id, name, handle, avatar_url),
				request:request_id(id, title)
			`,
			)
			.eq('expert_id', expert_id)
			.order('created_at', { ascending: false });

		if (error)
			throw new Error(
				`Failed to select reviews by expert id: ${error.message}`,
			);
		return data;
	},

	// 특정 사용자가 특정 전문가 요청에 대해 작성한 리뷰 조회
	select_by_request_and_reviewer: async (request_id, reviewer_id) => {
		const { data, error } = await supabase
			.from('expert_request_reviews')
			.select(
				`
				*,
				reviewer:reviewer_id(id, name, handle, avatar_url),
				expert:expert_id(id, name, handle, avatar_url),
				request:request_id(id, title),
				proposal:proposal_id(id, message)
			`,
			)
			.eq('request_id', request_id)
			.eq('reviewer_id', reviewer_id)
			.order('created_at', { ascending: false})
			.limit(1)
			.maybeSingle();

		if (error) {
			throw new Error(
				`Failed to select review by request and reviewer: ${error.message}`,
			);
		}
		return data;
	},

	// 제안별 리뷰 조회
	select_by_proposal_id: async (proposal_id) => {
		const { data, error } = await supabase
			.from('expert_request_reviews')
			.select(
				`
				*,
				reviewer:reviewer_id(id, name, handle, avatar_url),
				expert:expert_id(id, name, handle, avatar_url),
				request:request_id(id, title)
			`,
			)
			.eq('proposal_id', proposal_id)
			.maybeSingle();

		if (error && error.code !== 'PGRST116') {
			throw new Error(
				`Failed to select review by proposal id: ${error.message}`,
			);
		}
		return data;
	},

	// 평점별 리뷰 조회
	select_by_rating: async (request_id, rating) => {
		const { data, error } = await supabase
			.from('expert_request_reviews')
			.select(
				`
				*,
				reviewer:reviewer_id(id, name, handle, avatar_url),
				expert:expert_id(id, name, handle, avatar_url)
			`,
			)
			.eq('request_id', request_id)
			.eq('rating', rating)
			.order('created_at', { ascending: false });

		if (error)
			throw new Error(`Failed to select reviews by rating: ${error.message}`);
		return data;
	},

	// 리뷰 작성 가능 여부 확인 (완료된 프로젝트이고 선택된 전문가가 있는지 확인)
	can_write_review: async (request_id, user_id) => {
		// 1) 전문가 요청 상태 확인 (completed 상태이고 selected_expert_id가 있는지)
		const { data: request, error: requestError } = await supabase
			.from('expert_requests')
			.select('id, status, requester_id, selected_expert_id')
			.eq('id', request_id)
			.single();

		if (requestError) {
			console.error('전문가 요청 확인 실패:', requestError);
			return { can_write: false, expert_id: null };
		}

		// 요청자가 아니면 리뷰 작성 불가
		if (request.requester_id !== user_id) {
			return { can_write: false, expert_id: null };
		}

		// 완료된 프로젝트가 아니면 리뷰 작성 불가
		if (request.status !== 'completed') {
			return { can_write: false, expert_id: null };
		}

		// 선택된 전문가가 없으면 리뷰 작성 불가
		if (!request.selected_expert_id) {
			return { can_write: false, expert_id: null };
		}

		// 2) 이미 리뷰가 작성되었는지 확인
		const { data: existingReview, error: reviewError } = await supabase
			.from('expert_request_reviews')
			.select('id')
			.eq('request_id', request_id)
			.eq('reviewer_id', user_id)
			.maybeSingle();

		if (reviewError && reviewError.code !== 'PGRST116') {
			console.error('리뷰 확인 실패:', reviewError);
			return { can_write: false, expert_id: null };
		}

		// 이미 리뷰가 있으면 작성 불가
		if (existingReview) {
			return { can_write: false, expert_id: null };
		}

		return {
			can_write: true,
			expert_id: request.selected_expert_id,
		};
	},
});
