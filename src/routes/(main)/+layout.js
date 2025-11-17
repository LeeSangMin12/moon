import {
	createBrowserClient,
	createServerClient,
	isBrowser,
} from '@supabase/ssr';
import {
	PUBLIC_SUPABASE_ANON_KEY,
	PUBLIC_SUPABASE_URL,
} from '$env/static/public';

export const load = async ({ fetch, data, depends }) => {
	const start = performance.now();
	console.log('🔵 [+layout.js] Load started');

	depends('supabase:auth');

	const supabase = isBrowser()
		? createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
				global: {
					fetch,
				},
			})
		: createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
				global: {
					fetch,
				},
				cookies: {
					getAll() {
						return data.cookies;
					},
				},
			});

	if (isBrowser()) {
		const sessionStart = performance.now();
		const {
			data: { session },
		} = await supabase.auth.getSession();
		const sessionEnd = performance.now();

		console.log(`⏱️  [+layout.js] getSession took: ${sessionEnd - sessionStart}ms`);
		console.log(`⏱️  [+layout.js] Total load took: ${sessionEnd - start}ms`);

		return {
			supabase,
			session,
		};
	}

	return {};
};
