import { create_api } from '$lib/supabase/api';

export async function load({ params, parent, locals: { supabase } }) {
	const { user } = await parent();
	const api = create_api(supabase);

	let joined_communities = [];
	let community_members = [];

	if (user) {
		joined_communities = await await api.community_members.select_by_user_id(
			user.id,
		);
		community_members = await api.community_members.select_by_user_id(user.id);
	}

	return {
		joined_communities,
		community_members,
	};
}
