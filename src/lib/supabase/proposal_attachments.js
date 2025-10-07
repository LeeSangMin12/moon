export const create_proposal_attachments_api = (supabase) => ({
	// proposal_id로 첨부파일 목록 조회
	select_by_proposal_id: async (proposal_id) => {
		const { data, error } = await supabase
			.from('proposal_attachments')
			.select('*')
			.eq('proposal_id', proposal_id)
			.order('created_at', { ascending: true });

		if (error) throw new Error(`Failed to select attachments by proposal_id: ${error.message}`);
		return data;
	},

	// 첨부파일 단건 조회
	select_by_id: async (id) => {
		const { data, error } = await supabase
			.from('proposal_attachments')
			.select('*')
			.eq('id', id)
			.single();

		if (error) throw new Error(`Failed to select attachment by id: ${error.message}`);
		return data;
	},

	// 첨부파일 업로드
	insert: async (attachment_data, user_id) => {
		// 인증 확인
		if (!user_id) {
			throw new Error('로그인이 필요합니다.');
		}

		// 해당 제안의 소유자인지 확인
		const { data: proposal, error: proposal_error } = await supabase
			.from('expert_request_proposals')
			.select('expert_id')
			.eq('id', attachment_data.proposal_id)
			.single();

		if (proposal_error || !proposal) {
			throw new Error('제안을 찾을 수 없습니다.');
		}

		if (proposal.expert_id !== user_id) {
			throw new Error('자신의 제안에만 파일을 첨부할 수 있습니다.');
		}

		const sanitized_data = {
			proposal_id: attachment_data.proposal_id,
			file_url: attachment_data.file_url,
			file_name: attachment_data.file_name,
			file_size: attachment_data.file_size,
			file_type: attachment_data.file_type,
			created_at: new Date().toISOString()
		};

		const { data, error } = await supabase
			.from('proposal_attachments')
			.insert(sanitized_data)
			.select('id')
			.single();

		if (error) {
			throw new Error(`첨부파일 업로드 실패: ${error.message}`);
		}

		return data;
	},

	// 여러 첨부파일 동시 업로드
	insert_multiple: async (attachments_data, user_id) => {
		// 인증 확인
		if (!user_id) {
			throw new Error('로그인이 필요합니다.');
		}

		if (!attachments_data || attachments_data.length === 0) {
			return [];
		}

		// 모든 첨부파일이 같은 proposal_id를 가지는지 확인
		const proposal_id = attachments_data[0].proposal_id;
		if (!attachments_data.every(att => att.proposal_id === proposal_id)) {
			throw new Error('모든 첨부파일은 같은 제안에 속해야 합니다.');
		}

		// 해당 제안의 소유자인지 확인
		const { data: proposal, error: proposal_error } = await supabase
			.from('expert_request_proposals')
			.select('expert_id')
			.eq('id', proposal_id)
			.single();

		if (proposal_error || !proposal) {
			throw new Error('제안을 찾을 수 없습니다.');
		}

		if (proposal.expert_id !== user_id) {
			throw new Error('자신의 제안에만 파일을 첨부할 수 있습니다.');
		}

		const sanitized_data = attachments_data.map(att => ({
			proposal_id: att.proposal_id,
			file_url: att.file_url,
			file_name: att.file_name,
			file_size: att.file_size,
			file_type: att.file_type,
			created_at: new Date().toISOString()
		}));

		const { data, error } = await supabase
			.from('proposal_attachments')
			.insert(sanitized_data)
			.select();

		if (error) {
			throw new Error(`첨부파일 업로드 실패: ${error.message}`);
		}

		return data;
	},

	// 첨부파일 삭제
	delete: async (attachment_id, user_id) => {
		// 인증 확인
		if (!user_id) {
			throw new Error('로그인이 필요합니다.');
		}

		// 첨부파일 소유권 확인
		const { data: attachment, error: check_error } = await supabase
			.from('proposal_attachments')
			.select(`
				id,
				file_url,
				expert_request_proposals!inner(expert_id)
			`)
			.eq('id', attachment_id)
			.single();

		if (check_error || !attachment) {
			throw new Error('첨부파일을 찾을 수 없습니다.');
		}

		if (attachment.expert_request_proposals.expert_id !== user_id) {
			throw new Error('자신의 첨부파일만 삭제할 수 있습니다.');
		}

		const { error } = await supabase
			.from('proposal_attachments')
			.delete()
			.eq('id', attachment_id);

		if (error) {
			throw new Error(`첨부파일 삭제 실패: ${error.message}`);
		}

		return { file_url: attachment.file_url };
	}
});
