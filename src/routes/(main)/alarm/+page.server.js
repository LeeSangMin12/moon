import { create_api } from '$lib/supabase/api';

export async function load({ parent, locals: { supabase } }) {
	const api = create_api(supabase);

	const { user } = await parent();

	const notifications = user ? await api.notifications.select_list(user.id, 50) : [];

	return {
		notifications,
	};
}
