import { create_api } from '$lib/supabase/api';
import { redirect, error } from '@sveltejs/kit';

export async function load({ params, url, parent, locals: { supabase } }) {
	const api = create_api(supabase);
	const { user } = await parent();

	if (!user) {
		redirect(303, '/login');
	}

	const proposal_id = parseInt(url.searchParams.get('proposal_id'));

	if (!proposal_id) {
		error(400, '제안 ID가 필요합니다.');
	}

	// 병렬로 데이터 가져오기
	const [expert_request, proposal, bank_accounts] = await Promise.all([
		api.expert_requests.select_by_id(params.id),
		api.expert_request_proposals.select_by_id(proposal_id),
		api.user_bank_accounts.select_by_user_id(user.id),
	]);

	if (!expert_request) {
		error(404, '외주 요청을 찾을 수 없습니다.');
	}

	if (!proposal) {
		error(404, '제안을 찾을 수 없습니다.');
	}

	// 의뢰인만 결제 가능
	if (expert_request.requester_id !== user.id) {
		error(403, '결제 권한이 없습니다.');
	}

	// 이미 결제 중이거나 진행 중인 경우
	if (expert_request.status !== 'open') {
		error(400, '이미 처리된 요청입니다.');
	}

	return {
		expert_request,
		proposal,
		bank_accounts,
	};
}
