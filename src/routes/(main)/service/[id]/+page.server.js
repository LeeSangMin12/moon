import { create_api } from '$lib/supabase/api';

export async function load({ params, parent, locals: { supabase }, setHeaders }) {
	const api = create_api(supabase);

	setHeaders({
		'Cache-Control': 'public, max-age=30, s-maxage=60',
	});

	const { user } = await parent();

	const [service, service_likes, service_reviews, review_permission, my_review] = await Promise.all([
		api.services.select_by_id(params.id),
		user ? api.service_likes.select_by_user_id(user.id) : Promise.resolve([]),
		api.service_reviews.select_by_service_id(params.id),
		user ? api.service_reviews.can_write_review(params.id, user.id) : Promise.resolve({ can_write: false, order_id: null }),
		user ? api.service_reviews.select_by_service_and_reviewer(params.id, user.id) : Promise.resolve(null)
	]);

	return {
		service,
		service_likes,
		service_reviews,
		can_write_review: review_permission.can_write,
		review_order_id: review_permission.order_id,
		my_review,
	};
}
