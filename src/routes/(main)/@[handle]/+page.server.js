import { create_api } from '$lib/supabase/api';

export async function load({ params, parent, locals: { supabase } }) {
	const api = create_api(supabase);
	const { handle } = params;

	const user = await api.users.select_by_handle(handle);
	const posts = await api.posts.select_by_user_id(user.id);

	const follower_count = await api.user_follows.get_follower_count(user.id);
	const following_count = await api.user_follows.get_following_count(user.id);

	return { user, posts, follower_count, following_count };
}
