import { create_api } from '$lib/supabase/api';

export const load = async ({ locals: { get_user, supabase }, cookies }) => {
	const { auth_user } = await get_user();
	const api = create_api(supabase);

	const user = await api.users.select(auth_user?.id);

	return {
		user,
		cookies: cookies.getAll(),
	};
};
