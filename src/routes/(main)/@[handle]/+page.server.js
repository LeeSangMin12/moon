import { create_api } from '$lib/supabase/api';

export async function load({ params, parent, locals: { supabase }, setHeaders }) {
	const api = create_api(supabase);
	const { handle } = params;

	const { user: current_user } = await parent();

	// 프로필 정보는 공개 데이터이므로 캐시 활성화
	setHeaders({
		'Cache-Control': current_user?.id
			? 'private, max-age=30, must-revalidate'
			: 'public, max-age=120, stale-while-revalidate=300',
	});

	// 필수 데이터만 서버에서 로드 (사용자 정보와 게시물)
	const user = await api.users.select_by_handle(handle);
	const posts = await api.posts.select_by_user_id(user.id, 10);

	return { user, posts };
}
