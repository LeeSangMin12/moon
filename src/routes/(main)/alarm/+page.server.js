import { create_api } from '$lib/supabase/api';

export async function load({ parent, locals: { supabase } }) {
	const { user } = await parent();
	const api = create_api(supabase);

	if (!user) {
		return { notifications: [] };
	}

	const notifications = await api.notifications.select_list(user.id, 50);
	return { notifications };
}
