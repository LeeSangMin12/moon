import { create_api } from '$lib/supabase/api';

export async function load({ url, params, parent, locals: { supabase } }) {
	const { user } = await parent();
	const api = create_api(supabase);

	const community_members = await api.community_members.select_by_user_id(
		user.id,
	);

	return {
		community_members,
	};
}
