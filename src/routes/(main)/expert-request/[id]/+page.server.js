import { create_api } from '$lib/supabase/api';
import { error } from '@sveltejs/kit';

export async function load({ params, parent, locals: { supabase }, setHeaders }) {
	const api = create_api(supabase);

	// 사용자별 데이터(리뷰 권한)가 포함되므로 캐시 비활성화
	setHeaders({
		'Cache-Control': 'private, max-age=0, must-revalidate',
	});

	try {
		const { user } = await parent();

		// 전문가 요청 상세 정보 조회
		const expert_request = await api.expert_requests.select_by_id(parseInt(params.id));

		if (!expert_request) {
			throw error(404, '전문가 요청을 찾을 수 없습니다.');
		}

		// 병렬 쿼리
		const [proposals, review_permission, my_review] = await Promise.all([
			api.expert_request_proposals.select_by_request_id(parseInt(params.id)),
			user?.id ? api.expert_request_reviews.can_write_review(parseInt(params.id), user.id) : Promise.resolve({ can_write: false, expert_id: null }),
			user?.id ? api.expert_request_reviews.select_by_request_and_reviewer(parseInt(params.id), user.id) : Promise.resolve(null)
		]);

		return {
			expert_request,
			proposals,
			user,
			can_write_review: review_permission.can_write,
			review_expert_id: review_permission.expert_id,
			my_review,
		};
	} catch (err) {
		console.error('Expert request detail loading error:', err);
		throw error(500, '데이터를 불러오는 중 오류가 발생했습니다.');
	}
}