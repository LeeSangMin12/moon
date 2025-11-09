import { create_api } from '$lib/supabase/api';

export const load = async ({ params, parent, locals: { supabase }, url }) => {
	const { post_id } = params;
	const api = create_api(supabase);

	const { user } = await parent();

	const [post, comments] = await Promise.all([
		api.posts.select_by_id(post_id),
		api.post_comments.select_by_post_id(post_id, user?.id)
	]);

	return {
		post,
		comments,
		page_url: url.origin + url.pathname,
	};
};
