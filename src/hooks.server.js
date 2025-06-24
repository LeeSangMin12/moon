import { createServerClient } from '@supabase/ssr';
import {
	PUBLIC_SUPABASE_ANON_KEY,
	PUBLIC_SUPABASE_URL,
} from '$env/static/public';

export const handle = async ({ event, resolve }) => {
	event.locals.supabase = createServerClient(
		PUBLIC_SUPABASE_URL,
		PUBLIC_SUPABASE_ANON_KEY,
		{
			cookies: {
				getAll: () => event.cookies.getAll(),
				setAll: (cookiesToSet) => {
					cookiesToSet.forEach(({ name, value, options }) => {
						event.cookies.set(name, value, { ...options, path: '/' });
					});
				},
			},
		},
	);

	event.locals.get_user = async () => {
		const {
			data: { user },
			error,
		} = await event.locals.supabase.auth.getUser();
		const auth_user = user;

		if (error || !auth_user) {
			return { auth_user: null };
		}

		return { auth_user };
	};

	return resolve(event);
};
