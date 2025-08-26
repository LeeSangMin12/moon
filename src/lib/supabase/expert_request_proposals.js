export const create_expert_request_proposals_api = (supabase) => ({
	select_by_request_id: async (request_id) => {
		const { data, error } = await supabase
			.from('expert_request_proposals')
			.select(`
				*,
				users:expert_id(id, handle, name, avatar_url),
				expert_requests:request_id(id, title)
			`)
			.eq('request_id', request_id)
			.order('created_at', { ascending: false });

		if (error) throw new Error(`Failed to select proposals by request_id: ${error.message}`);
		return data;
	},

	select_by_expert_id: async (expert_id) => {
		const { data, error } = await supabase
			.from('expert_request_proposals')
			.select(`
				*,
				users:expert_id(id, handle, name, avatar_url),
				expert_requests:request_id(
					id, 
					title, 
					requester_id, 
					status, 
					budget_min, 
					budget_max, 
					category,
					created_at,
					users:requester_id(id, handle, name, avatar_url)
				)
			`)
			.eq('expert_id', expert_id)
			.order('created_at', { ascending: false });

		if (error) throw new Error(`Failed to select proposals by expert_id: ${error.message}`);
		return data;
	},

	select_by_id: async (id) => {
		const { data, error } = await supabase
			.from('expert_request_proposals')
			.select(`
				*,
				users:expert_id(id, handle, name, avatar_url),
				expert_requests:request_id(id, title, requester_id)
			`)
			.eq('id', id)
			.single();

		if (error) throw new Error(`Failed to select proposal by id: ${error.message}`);
		return data;
	},

	insert: async (proposal_data, user_id) => {
		// 인증 확인
		if (!user_id) {
			throw new Error('로그인이 필요합니다.');
		}

		// 요청이 존재하고 열린 상태인지 확인
		const { data: request_info, error: request_error } = await supabase
			.from('expert_requests')
			.select('id, status, requester_id')
			.eq('id', proposal_data.request_id)
			.single();

		if (request_error || !request_info) {
			throw new Error('존재하지 않는 요청입니다.');
		}

		if (request_info.status !== 'open') {
			throw new Error('이미 마감된 요청입니다.');
		}

		// 자신의 요청에는 제안할 수 없음
		if (request_info.requester_id === user_id) {
			throw new Error('자신의 요청에는 제안할 수 없습니다.');
		}

		// 이미 제안했는지 확인
		const { data: existing_proposal, error: existing_error } = await supabase
			.from('expert_request_proposals')
			.select('id')
			.eq('request_id', proposal_data.request_id)
			.eq('expert_id', user_id)
			.single();

		if (existing_proposal) {
			throw new Error('이미 해당 요청에 제안을 제출했습니다.');
		}

		const sanitized_data = {
			...proposal_data,
			expert_id: user_id,
			status: 'pending',
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString()
		};

		const { data, error } = await supabase
			.from('expert_request_proposals')
			.insert(sanitized_data)
			.select('id')
			.single();

		if (error) {
			if (error.code === '23505') { // Unique violation
				throw new Error('이미 해당 요청에 제안을 제출했습니다.');
			}
			throw new Error(`제안서 생성 실패: ${error.message}`);
		}

		return data;
	},

	update: async (proposal_id, proposal_data) => {
		const { data, error } = await supabase
			.from('expert_request_proposals')
			.update(proposal_data)
			.eq('id', proposal_id)
			.select()
			.single();

		if (error) {
			throw new Error(`제안서 업데이트 실패: ${error.message}`);
		}

		return data;
	},

	update_status: async (proposal_id, status) => {
		const { data, error } = await supabase
			.from('expert_request_proposals')
			.update({ status })
			.eq('id', proposal_id)
			.select()
			.single();

		if (error) {
			throw new Error(`제안서 상태 업데이트 실패: ${error.message}`);
		}

		return data;
	},

	delete: async (proposal_id) => {
		const { error } = await supabase
			.from('expert_request_proposals')
			.delete()
			.eq('id', proposal_id);

		if (error) {
			throw new Error(`제안서 삭제 실패: ${error.message}`);
		}
	},

	// 제안 수락 (다른 모든 제안은 자동으로 거절됨)
	accept_proposal: async (proposal_id, request_id) => {
		const { error } = await supabase.rpc('accept_proposal', {
			proposal_id_param: proposal_id,
			request_id_param: request_id
		});

		if (error) {
			throw new Error(`제안 수락 실패: ${error.message}`);
		}
	},

	// 제안 거절
	reject_proposal: async (proposal_id) => {
		const { data, error } = await supabase
			.from('expert_request_proposals')
			.update({ status: 'rejected' })
			.eq('id', proposal_id)
			.select()
			.single();

		if (error) {
			throw new Error(`제안 거절 실패: ${error.message}`);
		}

		return data;
	}
});