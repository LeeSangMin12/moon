import { create_api } from '$lib/supabase/api';

export async function load({ params, parent, locals: { supabase } }) {
	const { user } = await parent();
	const api = create_api(supabase);

	const bookmarks = await api.post_bookmarks.select_by_user_id(user.id);

	return {
		bookmarks,
	};
}
