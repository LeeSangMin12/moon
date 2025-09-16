export const create_expert_requests_api = (supabase) => ({
	select: async () => {
		const { data, error } = await supabase
			.from('expert_requests')
			.select(`
				*,
				users:requester_id(id, handle, name, avatar_url),
				expert_request_proposals(
					id,
					expert_id,
					message,
					status,
					created_at,
					contact_info,
					is_secret,
					users:expert_id(id, handle, name, avatar_url)
				)
			`)
			.is('deleted_at', null)
			.order('created_at', { ascending: false });

		if (error) throw new Error(`Failed to select expert_requests: ${error.message}`);
		return data;
	},

	select_by_id: async (id) => {
		const { data, error } = await supabase
			.from('expert_requests')
			.select(`
				*,
				users:requester_id(id, handle, name, avatar_url),
				expert_request_proposals(
					id,
					expert_id,
					message,
					status,
					created_at,
					contact_info,
					is_secret,
					users:expert_id(id, handle, name, avatar_url)
				)
			`)
			.eq('id', id)
			.is('deleted_at', null)
			.single();

		if (error) throw new Error(`Failed to select expert_request by id: ${error.message}`);
		return data;
	},

	select_by_category: async (category) => {
		const { data, error } = await supabase
			.from('expert_requests')
			.select(`
				*,
				users:requester_id(id, handle, name, avatar_url),
				expert_request_proposals(count)
			`)
			.eq('category', category)
			.eq('status', 'open')
			.is('deleted_at', null)
			.order('created_at', { ascending: false });

		if (error) throw new Error(`Failed to select expert_requests by category: ${error.message}`);
		return data;
	},

	select_by_search: async (search_text) => {
		// SQL 인젝션 방지를 위한 검색어 정제
		const sanitizedSearch = search_text.replace(/[%_\\]/g, '\\$&');
		
		const { data, error } = await supabase
			.from('expert_requests')
			.select(`
				*,
				users:requester_id(id, handle, name, avatar_url),
				expert_request_proposals(count)
			`)
			.or(`title.ilike.%${sanitizedSearch}%,description.ilike.%${sanitizedSearch}%,category.ilike.%${sanitizedSearch}%`)
			.eq('status', 'open')
			.is('deleted_at', null)
			.order('created_at', { ascending: false });

		if (error) throw new Error(`Failed to select expert_requests by search: ${error.message}`);
		return data;
	},

	select_infinite_scroll: async (last_request_id, category = '', limit = 20) => {
		// 보안을 위한 limit 제한
		const MAX_LIMIT = 50;
		const sanitizedLimit = Math.min(Math.max(1, parseInt(limit) || 20), MAX_LIMIT);

		let query = supabase
			.from('expert_requests')
			.select(`
				*,
				users:requester_id(id, handle, name, avatar_url),
				expert_request_proposals(count)
			`)
			.eq('status', 'open')
			.is('deleted_at', null)
			.order('created_at', { ascending: false })
			.limit(sanitizedLimit);

		if (category !== '') {
			query = query.eq('category', category);
		}

		if (last_request_id !== '') {
			const lastId = parseInt(last_request_id);
			if (!isNaN(lastId) && lastId > 0) {
				query = query.lt('id', lastId);
			}
		}

		const { data, error } = await query;

		if (error) throw new Error(`Failed to select_infinite_scroll expert_requests: ${error.message}`);
		
		// 결과가 요청한 limit보다 적으면 더 이상 데이터가 없음을 표시
		const hasMore = data.length === sanitizedLimit;
		
		return {
			data: data || [],
			hasMore,
			nextCursor: data && data.length > 0 ? data[data.length - 1].id : null
		};
	},

	select_by_requester_id: async (requester_id) => {
		const { data, error } = await supabase
			.from('expert_requests')
			.select(`
				*,
				users:requester_id(id, handle, name, avatar_url),
				expert_request_proposals(count)
			`)
			.eq('requester_id', requester_id)
			.is('deleted_at', null)
			.order('created_at', { ascending: false });

		if (error) throw new Error(`Failed to select expert_requests by requester_id: ${error.message}`);
		return data;
	},

	insert: async (request_data, user_id) => {
		// 인증 확인
		if (!user_id) {
			throw new Error('로그인이 필요합니다.');
		}

		// 요청자 ID 설정 및 검증
		const sanitized_data = {
			title: request_data.title,
			category: request_data.category,
			description: request_data.description,
			reward_amount: request_data.reward_amount,
			application_deadline: request_data.application_deadline || null,
			work_start_date: request_data.work_start_date || null,
			work_end_date: request_data.work_end_date || null,
			max_applicants: request_data.max_applicants,
			work_location: request_data.work_location,
			requester_id: user_id,
			status: 'open',
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString()
		};

		// 권한 검증 - 자신의 요청만 생성 가능
		if (sanitized_data.requester_id !== user_id) {
			throw new Error('다른 사용자의 요청을 생성할 수 없습니다.');
		}

		const { data, error } = await supabase
			.from('expert_requests')
			.insert(sanitized_data)
			.select('id')
			.single();

		if (error) {
			if (error.code === '23505') { // Unique violation
				throw new Error('이미 동일한 요청이 존재합니다.');
			}
			throw new Error(`전문가 요청 생성 실패: ${error.message}`);
		}

		return data;
	},

	update: async (request_id, request_data, user_id) => {
		// 인증 확인
		if (!user_id) {
			throw new Error('로그인이 필요합니다.');
		}

		// 요청 소유권 확인
		const { data: existing_request, error: check_error } = await supabase
			.from('expert_requests')
			.select('requester_id, status')
			.eq('id', request_id)
			.single();

		if (check_error || !existing_request) {
			throw new Error('요청을 찾을 수 없습니다.');
		}

		if (existing_request.requester_id !== user_id) {
			throw new Error('자신의 요청만 수정할 수 있습니다.');
		}

		// 진행 중이거나 완료된 요청은 수정 불가
		if (existing_request.status !== 'open') {
			throw new Error('진행 중이거나 완료된 요청은 수정할 수 없습니다.');
		}

		const sanitized_data = {
			title: request_data.title || existing_request.title,
			category: request_data.category || existing_request.category,
			description: request_data.description || existing_request.description,
			reward_amount: request_data.reward_amount || existing_request.reward_amount,
			application_deadline: request_data.application_deadline !== undefined ? request_data.application_deadline : existing_request.application_deadline,
			work_start_date: request_data.work_start_date !== undefined ? request_data.work_start_date : existing_request.work_start_date,
			work_end_date: request_data.work_end_date !== undefined ? request_data.work_end_date : existing_request.work_end_date,
			max_applicants: request_data.max_applicants || existing_request.max_applicants,
			work_location: request_data.work_location || existing_request.work_location,
			updated_at: new Date().toISOString(),
			// 중요 필드는 업데이트 불가
			requester_id: existing_request.requester_id,
			status: existing_request.status
		};

		const { data, error } = await supabase
			.from('expert_requests')
			.update(sanitized_data)
			.eq('id', request_id)
			.select()
			.single();

		if (error) {
			throw new Error(`전문가 요청 업데이트 실패: ${error.message}`);
		}

		return data;
	},

	// Soft delete 구현
	delete: async (request_id, user_id) => {
		// 인증 확인
		if (!user_id) {
			throw new Error('로그인이 필요합니다.');
		}

		// 요청 소유권 확인
		const { data: existing_request, error: check_error } = await supabase
			.from('expert_requests')
			.select('requester_id, status')
			.eq('id', request_id)
			.single();

		if (check_error || !existing_request) {
			throw new Error('요청을 찾을 수 없습니다.');
		}

		if (existing_request.requester_id !== user_id) {
			throw new Error('자신의 요청만 삭제할 수 있습니다.');
		}

		// 진행 중인 요청은 삭제 불가
		if (existing_request.status === 'in_progress') {
			throw new Error('진행 중인 요청은 삭제할 수 없습니다.');
		}

		// Soft delete 수행
		const { error } = await supabase
			.from('expert_requests')
			.update({ 
				deleted_at: new Date().toISOString(),
				status: 'cancelled'
			})
			.eq('id', request_id);

		if (error) {
			throw new Error(`전문가 요청 삭제 실패: ${error.message}`);
		}
	},

	// 프로젝트 완료
	complete_project: async (request_id) => {
		const { error } = await supabase.rpc('complete_project', {
			request_id_param: request_id
		});

		if (error) {
			throw new Error(`프로젝트 완료 실패: ${error.message}`);
		}
	}
});