import { create_api } from '$lib/supabase/api';

export const load = async ({ params, parent, locals: { supabase }, url, setHeaders }) => {
	const { post_id } = params;
	const api = create_api(supabase);

	// 사용자 상호작용(북마크, 좋아요 등)이 빈번한 페이지이므로 캐시 비활성화
	setHeaders({
		'Cache-Control': 'no-cache, no-store, must-revalidate',
	});

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
