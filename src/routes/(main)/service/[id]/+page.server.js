import { create_api } from '$lib/supabase/api';

export async function load({ params, parent, locals: { supabase }, setHeaders }) {
	const api = create_api(supabase);

	// 사용자별 데이터(서비스 좋아요, 리뷰 권한)가 포함되므로 캐시 비활성화
	setHeaders({
		'Cache-Control': 'private, max-age=0, must-revalidate',
	});

	const { user } = await parent();

	const [service, service_likes, service_reviews, review_permission, my_review, service_options] = await Promise.all([
		api.services.select_by_id(params.id),
		user?.id ? api.service_likes.select_by_user_id(user.id) : Promise.resolve([]),
		api.service_reviews.select_by_service_id(params.id),
		user?.id ? api.service_reviews.can_write_review(params.id, user.id) : Promise.resolve({ can_write: false, order_id: null }),
		user?.id ? api.service_reviews.select_by_service_and_reviewer(params.id, user.id) : Promise.resolve(null),
		api.service_options.select_by_service_id(params.id)
	]);

	return {
		service,
		service_likes,
		service_reviews,
		can_write_review: review_permission.can_write,
		review_order_id: review_permission.order_id,
		my_review,
		service_options,
	};
}
