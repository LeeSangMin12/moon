export const create_expert_requests_api = (supabase) => ({
	select: async () => {
		const { data, error } = await supabase
			.from('expert_requests')
			.select(
				`
				*,
				users:requester_id(id, handle, name, avatar_url),
				expert_request_proposals!request_id(
					id,
					expert_id,
					message,
					status,
					created_at,
					contact_info,
					is_secret,
					proposed_amount,
					users:expert_id(id, handle, name, avatar_url)
				)
			`,
			)
			.is('deleted_at', null)
			.order('created_at', { ascending: false });

		if (error)
			throw new Error(`Failed to select expert_requests: ${error.message}`);
		return data;
	},

	select_by_id: async (id) => {
		const { data, error } = await supabase
			.from('expert_requests')
			.select(
				`
				*,
				users:requester_id(id, handle, name, avatar_url),
				expert_request_proposals!request_id(
					id,
					expert_id,
					message,
					status,
					created_at,
					contact_info,
					is_secret,
					proposed_amount,
					users:expert_id(id, handle, name, avatar_url)
				)
			`,
			)
			.eq('id', id)
			.is('deleted_at', null)
			.single();

		if (error)
			throw new Error(
				`Failed to select expert_request by id: ${error.message}`,
			);
		return data;
	},

	select_by_category: async (category) => {
		const { data, error } = await supabase
			.from('expert_requests')
			.select(
				`
				*,
				users:requester_id(id, handle, name, avatar_url),
				expert_request_proposals!request_id(count)
			`,
			)
			.eq('category', category)
			.eq('status', 'open')
			.is('deleted_at', null)
			.order('created_at', { ascending: false });

		if (error)
			throw new Error(
				`Failed to select expert_requests by category: ${error.message}`,
			);
		return data;
	},

	select_by_search: async (search_text) => {
		// SQL 인젝션 방지를 위한 검색어 정제
		const sanitizedSearch = search_text.replace(/[%_\\]/g, '\\$&');

		const { data, error } = await supabase
			.from('expert_requests')
			.select(
				`
				*,
				users:requester_id(id, handle, name, avatar_url),
				expert_request_proposals!request_id(count)
			`,
			)
			.or(
				`title.ilike.%${sanitizedSearch}%,description.ilike.%${sanitizedSearch}%,category.ilike.%${sanitizedSearch}%`,
			)
			.eq('status', 'open')
			.is('deleted_at', null)
			.order('created_at', { ascending: false });

		if (error)
			throw new Error(
				`Failed to select expert_requests by search: ${error.message}`,
			);
		return data;
	},

	select_infinite_scroll: async (
		last_request_id,
		category = '',
		limit = 20,
		job_type = '',
	) => {
		// 보안을 위한 limit 제한
		const MAX_LIMIT = 50;
		const sanitizedLimit = Math.min(
			Math.max(1, parseInt(limit) || 20),
			MAX_LIMIT,
		);

		const now = new Date().toISOString();

		let query = supabase
			.from('expert_requests')
			.select(
				`
				*,
				users:requester_id(id, handle, name, avatar_url),
				expert_request_proposals!request_id(count)
			`,
			)
			.eq('status', 'open')
			.is('deleted_at', null)
			.lte('posting_start_date', now) // 공고 시작일이 지났거나 오늘
			.gte('application_deadline', now) // 공고 마감일이 아직 안 지남
			.order('created_at', { ascending: false })
			.limit(sanitizedLimit);

		if (category !== '') {
			query = query.eq('category', category);
		}

		if (job_type !== '') {
			query = query.eq('job_type', job_type);
		}

		if (last_request_id !== '') {
			const lastId = parseInt(last_request_id);
			if (!isNaN(lastId) && lastId > 0) {
				query = query.lt('id', lastId);
			}
		}

		const { data, error } = await query;

		if (error)
			throw new Error(
				`Failed to select_infinite_scroll expert_requests: ${error.message}`,
			);

		// 결과가 요청한 limit보다 적으면 더 이상 데이터가 없음을 표시
		const hasMore = data.length === sanitizedLimit;

		return {
			data: data || [],
			hasMore,
			nextCursor: data && data.length > 0 ? data[data.length - 1].id : null,
		};
	},

	select_by_requester_id: async (requester_id) => {
		const { data, error } = await supabase
			.from('expert_requests')
			.select(
				`
				*,
				users:requester_id(id, handle, name, avatar_url),
				expert_request_proposals!request_id(count)
			`,
			)
			.eq('requester_id', requester_id)
			.is('deleted_at', null)
			.order('created_at', { ascending: false });

		if (error)
			throw new Error(
				`Failed to select expert_requests by requester_id: ${error.message}`,
			);
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
			price_unit: request_data.price_unit || 'per_project',
			posting_start_date: request_data.posting_start_date || null,
			application_deadline: request_data.application_deadline || null,
			work_start_date: request_data.work_start_date || null,
			work_end_date: request_data.work_end_date || null,
			max_applicants: request_data.max_applicants,
			work_location: request_data.work_location,
			job_type: request_data.job_type || 'sidejob',
			requester_id: user_id,
			status: 'open', // 무료 등록: 바로 공고 게시
			is_paid: true, // 무료이므로 결제 완료 처리
			registration_amount: 0, // 등록비 없음
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
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
			if (error.code === '23505') {
				// Unique violation
				throw new Error('이미 동일한 요청이 존재합니다.');
			}
			throw new Error(`전문가 요청 생성 실패: ${error.message}`);
		}

		return data;
	},

	// 등록비 결제 완료 처리 (입금 대기 상태로 변경)
	complete_registration_payment: async (request_id, payment_info, coupon_data = null) => {
		const update_data = {
			is_paid: false, // 아직 관리자 승인 전
			registration_paid_at: new Date().toISOString(),
			status: 'pending_payment', // 입금 대기 상태
			payment_info: payment_info, // 입금 정보 저장 (JSONB)
			updated_at: new Date().toISOString(),
		};

		// 쿠폰 정보가 있으면 추가
		if (coupon_data) {
			update_data.coupon_id = coupon_data.coupon_id;
			update_data.coupon_discount = coupon_data.coupon_discount;
		}

		const { data, error } = await supabase
			.from('expert_requests')
			.update(update_data)
			.eq('id', request_id)
			.select()
			.single();

		if (error) {
			throw new Error(`결제 처리 실패: ${error.message}`);
		}

		return data;
	},

	// 관리자 승인 (입금 확인 후)
	approve_payment: async (request_id) => {
		const { data, error } = await supabase
			.from('expert_requests')
			.update({
				is_paid: true,
				status: 'open', // 승인 후 공고 게시
				updated_at: new Date().toISOString(),
			})
			.eq('id', request_id)
			.eq('status', 'pending_payment') // pending_payment 상태인 것만 승인 가능
			.select()
			.single();

		if (error) {
			throw new Error(`승인 처리 실패: ${error.message}`);
		}

		return data;
	},

	// 관리자 거절 (입금 거절)
	reject_payment: async (request_id, reject_reason = null) => {
		const { data, error } = await supabase
			.from('expert_requests')
			.update({
				is_paid: false,
				status: 'cancelled', // 거절 시 취소 상태
				reject_reason: reject_reason, // 거절 사유 (선택)
				updated_at: new Date().toISOString(),
			})
			.eq('id', request_id)
			.eq('status', 'pending_payment') // pending_payment 상태인 것만 거절 가능
			.select()
			.single();

		if (error) {
			throw new Error(`거절 처리 실패: ${error.message}`);
		}

		return data;
	},

	// 입금 대기 중인 공고 목록 조회 (관리자용)
	select_pending_payments: async () => {
		const { data, error } = await supabase
			.from('expert_requests')
			.select(`
				*,
				users:requester_id(id, handle, name, avatar_url, email),
				expert:selected_expert_id(id, handle, name, avatar_url)
			`)
			.eq('status', 'pending_payment')
			.is('deleted_at', null)
			.order('created_at', { ascending: false });

		if (error) {
			console.error('Supabase error:', error);
			throw new Error(`입금 대기 목록 조회 실패: ${error.message}`);
		}

		return data || [];
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
			reward_amount:
				request_data.reward_amount || existing_request.reward_amount,
			application_deadline:
				request_data.application_deadline !== undefined
					? request_data.application_deadline
					: existing_request.application_deadline,
			work_start_date:
				request_data.work_start_date !== undefined
					? request_data.work_start_date
					: existing_request.work_start_date,
			work_end_date:
				request_data.work_end_date !== undefined
					? request_data.work_end_date
					: existing_request.work_end_date,
			max_applicants:
				request_data.max_applicants || existing_request.max_applicants,
			work_location:
				request_data.work_location || existing_request.work_location,
			updated_at: new Date().toISOString(),
			// 중요 필드는 업데이트 불가
			requester_id: existing_request.requester_id,
			status: existing_request.status,
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
				status: 'cancelled',
			})
			.eq('id', request_id);

		if (error) {
			throw new Error(`전문가 요청 삭제 실패: ${error.message}`);
		}
	},

	// 프로젝트 완료
	complete_project: async (request_id) => {
		const { error } = await supabase.rpc('complete_project', {
			request_id_param: request_id,
		});

		if (error) {
			throw new Error(`프로젝트 완료 실패: ${error.message}`);
		}
	},

	// 프로젝트 결제 정보 제출 (의뢰인이 제안 수락 후 결제 정보 입력)
	submit_project_payment: async (request_id, payment_data) => {
		// 1. 요청 정보 조회 및 검증
		const { data: request, error: fetchError } = await supabase
			.from('expert_requests')
			.select('id, status, requester_id')
			.eq('id', request_id)
			.single();

		if (fetchError || !request) {
			throw new Error('외주 요청을 찾을 수 없습니다.');
		}

		if (request.status !== 'open') {
			throw new Error('이미 처리된 요청입니다.');
		}

		// 2. 제안서 상태 업데이트 (수락)
		const { error: proposalError } = await supabase
			.from('expert_request_proposals')
			.update({
				status: 'accepted',
				updated_at: new Date().toISOString(),
			})
			.eq('id', payment_data.proposal_id);

		if (proposalError) {
			throw new Error(`제안서 상태 업데이트 실패: ${proposalError.message}`);
		}

		// 3. 외주 요청 업데이트 (결제 정보 저장)
		const { data, error } = await supabase
			.from('expert_requests')
			.update({
				status: 'pending_payment',
				accepted_proposal_id: payment_data.proposal_id,
				selected_expert_id: payment_data.expert_id,
				project_amount: payment_data.project_amount,
				commission_amount: payment_data.commission_amount,
				expert_payout: payment_data.expert_payout,
				payment_info: {
					depositor_name: payment_data.depositor_name,
					bank: payment_data.bank,
					account_number: payment_data.account_number,
					buyer_contact: payment_data.buyer_contact,
					special_request: payment_data.special_request || '',
				},
				updated_at: new Date().toISOString(),
			})
			.eq('id', request_id)
			.select()
			.single();

		if (error) {
			throw new Error(`결제 정보 저장 실패: ${error.message}`);
		}

		return data;
	},

	// 프로젝트 결제 승인 (관리자가 입금 확인 후)
	approve_project_payment: async (request_id) => {
		const { data, error } = await supabase
			.from('expert_requests')
			.update({
				status: 'in_progress',
				payment_confirmed_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			})
			.eq('id', request_id)
			.eq('status', 'pending_payment')
			.select()
			.single();

		if (error) {
			throw new Error(`결제 승인 실패: ${error.message}`);
		}

		return data;
	},

	// 프로젝트 결제 거절 (관리자)
	reject_project_payment: async (request_id, reject_reason = null) => {
		// 1. 외주 요청 상태 변경
		const { data: request, error: requestError } = await supabase
			.from('expert_requests')
			.update({
				status: 'open', // 다시 공고 상태로
				payment_info: null,
				project_amount: null,
				commission_amount: null,
				expert_payout: null,
				selected_expert_id: null,
				accepted_proposal_id: null,
				reject_reason: reject_reason,
				updated_at: new Date().toISOString(),
			})
			.eq('id', request_id)
			.eq('status', 'pending_payment')
			.select('accepted_proposal_id')
			.single();

		if (requestError) {
			throw new Error(`결제 거절 실패: ${requestError.message}`);
		}

		// 2. 수락된 제안서가 있으면 상태 되돌리기
		if (request?.accepted_proposal_id) {
			await supabase
				.from('expert_request_proposals')
				.update({
					status: 'pending',
					updated_at: new Date().toISOString(),
				})
				.eq('id', request.accepted_proposal_id);
		}

		return request;
	},

	// 프로젝트 완료 및 수수료 계산 (무료 등록 + 매칭 수수료 모델)
	complete_project_with_commission: async (request_id) => {
		// 1. 프로젝트 정보 조회
		const { data: request, error: fetchError } = await supabase
			.from('expert_requests')
			.select('id, title, reward_amount, commission_rate, status')
			.eq('id', request_id)
			.single();

		if (fetchError || !request) {
			throw new Error('프로젝트를 찾을 수 없습니다.');
		}

		if (request.status === 'completed') {
			throw new Error('이미 완료된 프로젝트입니다.');
		}

		// 2. 수락된 제안서의 전문가 조회
		const { data: accepted_proposal, error: proposalError } = await supabase
			.from('expert_request_proposals')
			.select('expert_id')
			.eq('request_id', request_id)
			.eq('status', 'accepted')
			.single();

		if (proposalError || !accepted_proposal) {
			throw new Error('수락된 제안서를 찾을 수 없습니다.');
		}

		// 3. 수수료 계산
		const commission_rate = request.commission_rate || 0.05;
		const commission_amount = Math.floor(request.reward_amount * commission_rate);
		const expert_payout = request.reward_amount - commission_amount;

		// 4. 상태 업데이트 + 수수료 기록
		const { data, error: updateError } = await supabase
			.from('expert_requests')
			.update({
				status: 'completed',
				commission_amount: commission_amount,
				expert_payout: expert_payout,
				completed_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			})
			.eq('id', request_id)
			.select()
			.single();

		if (updateError) {
			throw new Error(`프로젝트 완료 처리 실패: ${updateError.message}`);
		}

		// 5. 전문가에게 캐시 적립
		const { error: cashError } = await supabase.rpc('add_cash', {
			p_user_id: accepted_proposal.expert_id,
			p_amount: expert_payout,
			p_type: 'expert_payout',
			p_reference_type: 'expert_request',
			p_reference_id: request_id,
			p_description: `외주 완료: ${request.title}`,
		});

		if (cashError) {
			throw new Error(`캐시 적립 실패: ${cashError.message}`);
		}

		// 6. 전문가에게 알림 전송
		await supabase.from('notifications').insert({
			recipient_id: accepted_proposal.expert_id,
			type: 'expert_request_completed',
			resource_type: 'expert_request',
			resource_id: request_id,
			payload: {
				title: request.title,
				payout: expert_payout,
			},
			link_url: `/expert-request/${request_id}`,
		});

		return {
			...data,
			expert_id: accepted_proposal.expert_id,
			commission_amount,
			expert_payout,
		};
	},
});
