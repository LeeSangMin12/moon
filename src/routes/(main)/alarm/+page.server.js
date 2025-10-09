import { create_api } from '$lib/supabase/api';

export async function load({ parent, locals: { supabase }, setHeaders }) {
	const api = create_api(supabase);

	setHeaders({
		'Cache-Control': 'private, max-age=0, must-revalidate',
	});

	const { user } = await parent();

	const notifications = user ? await api.notifications.select_list(user.id, 50) : [];

	return {
		notifications,
	};
}
