import { error } from '@sveltejs/kit';
import { create_api } from '$lib/supabase/api';

export async function load({ params, parent, locals: { supabase } }) {
	const { user } = await parent();
	const api = create_api(supabase);

	const community = await api.communities.select_by_slug(params.slug);

	if (!community) {
		throw error(404, {
			message: 'Not found',
		});
	}

	const community_members = await api.community_members.select_by_user_id(
		user.id,
	);

	return {
		community,
		community_members,
	};
}
