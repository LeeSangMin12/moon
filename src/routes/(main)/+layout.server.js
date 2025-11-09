import { create_api } from '$lib/supabase/api';

export const load = async ({ locals: { get_user, supabase }, cookies }) => {
	const api = create_api(supabase);

	const { auth_user } = await get_user();

	if (!auth_user?.id) {
		return {
			user: null,
			cookies: cookies.getAll(),
		};
	}

	const user = await api.users.select(auth_user?.id);

	return {
		user,
		cookies: cookies.getAll(),
	};
};
