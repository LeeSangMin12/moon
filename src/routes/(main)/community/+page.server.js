import { create_api } from '$lib/supabase/api';

export async function load({ params, parent, locals: { supabase } }) {
	const { user } = await parent();

	const api = create_api(supabase);

	const communities = await api.communities.select_infinite_scroll('');

	let community_members = [];

	if (user) {
		community_members = await api.community_members.select_by_user_id(user.id);
	}

	return {
		communities,
		community_members,
	};
}
