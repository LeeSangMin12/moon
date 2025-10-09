import { create_api } from '$lib/supabase/api';

export async function load({ params, parent, locals: { supabase }, setHeaders }) {
	const api = create_api(supabase);

	// Set cache headers
	setHeaders({
		'Cache-Control': 'public, max-age=60, s-maxage=300',
	});

	const { user } = await parent();

	const [communities, community_members] = await Promise.all([
		api.communities.select_infinite_scroll(''),
		user?.id ? api.community_members.select_by_user_id(user.id) : Promise.resolve([])
	]);

	return {
		communities,
		community_members,
	};
}
