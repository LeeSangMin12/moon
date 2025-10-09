import { create_api } from '$lib/supabase/api';

export const load = async ({ locals: { get_user, supabase }, cookies }) => {
	const api = create_api(supabase);

	// STREAMING: Return user promise immediately, don't block
	const userPromise = get_user().then(({ auth_user }) =>
		auth_user?.id ? api.users.select(auth_user.id) : null
	);

	return {
		user: userPromise,
		cookies: cookies.getAll(),
	};
};
