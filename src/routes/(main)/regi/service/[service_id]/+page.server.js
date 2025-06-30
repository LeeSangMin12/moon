import { create_api } from '$lib/supabase/api';

export const load = async ({ params, parent, locals: { supabase } }) => {
	const { post_id } = params;
	const { user } = await parent();
	const api = create_api(supabase);

	const post = await api.posts.select_by_id(post_id);
	const community_members = await api.community_members.select_by_user_id(
		user.id,
	);

	return { post, community_members };
};
