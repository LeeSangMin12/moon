import { redirect } from '@sveltejs/kit';
import { create_api } from '$lib/supabase/api';

export const load = async ({ locals: { supabase }, parent, url }) => {
	const { user } = await parent();

	const is_admin_page = url.pathname === '/admin';

	if (is_admin_page) {
		if (user?.role === 'admin') {
			redirect(302, '/admin/home');
		}
	} else {
		if (user?.role !== 'admin') {
			redirect(302, '/');
		}
	}
};
