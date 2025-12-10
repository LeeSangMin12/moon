import { redirect } from '@sveltejs/kit';

export const load = async ({ locals: { supabase, get_user } }) => {
	const { auth_user } = await get_user();

	if (!auth_user?.id) {
		redirect(302, '/login');
	}
};
