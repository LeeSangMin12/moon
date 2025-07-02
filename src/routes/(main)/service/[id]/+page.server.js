import { create_api } from '$lib/supabase/api';

export async function load({ params, parent, locals: { supabase } }) {
	const { user } = await parent();
	const api = create_api(supabase);

	const service = await api.services.select_by_id(params.id);
	const service_likes = await api.service_likes.select_by_user_id(user?.id);
	const service_reviews = await api.service_reviews.select_by_service_id(
		params.id,
	);

	const review_permission = user
		? await api.service_reviews.can_write_review(params.id, user.id)
		: { can_write: false, order_id: null };
	const my_review = user
		? await api.service_reviews.select_by_service_and_reviewer(
				params.id,
				user.id,
			)
		: null;

	return {
		service,
		service_likes,
		service_reviews,
		can_write_review: review_permission.can_write,
		review_order_id: review_permission.order_id,
		my_review,
	};
}
