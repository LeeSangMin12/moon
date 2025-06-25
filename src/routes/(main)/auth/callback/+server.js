import { redirect } from '@sveltejs/kit';
import { create_api } from '$lib/supabase/api';

export const GET = async (event) => {
	const {
		url,
		locals: { supabase },
	} = event;
	const code = url.searchParams.get('code');
	const next = url.searchParams.get('next') ?? '/';

	const api = create_api(supabase);

	if (code) {
		const { data: session_data, error } =
			await supabase.auth.exchangeCodeForSession(code);

		if (!error && session_data.session) {
			const user_id = session_data.session.user.id;

			const user = await api.users.select(user_id);

			if (user.handle === null) {
				throw redirect(303, '/sign-up');
			} else {
				throw redirect(303, `/${next.slice(1)}`);
			}
		}
	}

	throw redirect(303, '/auth/auth-code-error');
};
