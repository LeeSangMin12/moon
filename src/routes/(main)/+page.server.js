import { create_api } from '$lib/supabase/api';

export const load = async ({ parent, locals: { supabase }, setHeaders }) => {
	const api = create_api(supabase);

	// Set cache headers for better performance
	setHeaders({
		'Cache-Control': 'public, max-age=60, s-maxage=300',
	});

	// STREAMING: Return promises immediately, don't await
	// This allows the page to render while data is loading
	const userPromise = parent().then(({ user }) => user);

	// Start loading posts immediately (don't wait for user)
	const postsPromise = api.posts.select_infinite_scroll('', '', 10);

	// Load communities only if user exists (but don't block)
	const communitiesPromise = userPromise.then(user =>
		user?.id
			? api.community_members.select_by_user_id(user.id).then(cms => cms.map(cm => cm.communities))
			: []
	);

	return {
		// Return promises - SvelteKit will stream them
		posts: postsPromise,
		joined_communities: communitiesPromise,
		streamed: true
	};
};
