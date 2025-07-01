import { create_api } from '$lib/supabase/api';

export async function load({ params, parent, locals: { supabase } }) {
	const { user } = await parent();
	const api = create_api(supabase);

	const service = await api.services.select_by_id(params.id);
	const service_likes = await api.service_likes.select_by_user_id(user?.id);

	return {
		service,
		service_likes,
	};
}
