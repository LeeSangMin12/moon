import { create_api } from '$lib/supabase/api';
import { error } from '@sveltejs/kit';

export async function load({ params, parent, locals: { supabase } }) {
	const { user } = await parent();
	const api = create_api(supabase);

	try {
		// 전문가 요청 상세 정보 조회
		const expert_request = await api.expert_requests.select_by_id(parseInt(params.id));

		if (!expert_request) {
			throw error(404, '전문가 요청을 찾을 수 없습니다.');
		}

		// 해당 요청에 대한 제안서들 조회
		const proposals = await api.expert_request_proposals.select_by_request_id(parseInt(params.id));

		// 리뷰 관련 데이터 조회 (로그인한 경우만)
		let can_write_review = false;
		let review_proposal_id = null;
		let review_expert_id = null;
		let my_review = null;

		if (user) {
			const review_permission = await api.expert_request_reviews.can_write_review(
				parseInt(params.id),
				user.id
			);
			can_write_review = review_permission.can_write;
			review_proposal_id = review_permission.proposal_id;
			review_expert_id = review_permission.expert_id;

			// 내가 작성한 리뷰 조회
			my_review = await api.expert_request_reviews.select_by_request_and_reviewer(
				parseInt(params.id),
				user.id
			);
		}

		return {
			expert_request,
			proposals,
			user,
			can_write_review,
			review_proposal_id,
			review_expert_id,
			my_review
		};
	} catch (err) {
		console.error('Expert request detail loading error:', err);
		throw error(500, '데이터를 불러오는 중 오류가 발생했습니다.');
	}
}