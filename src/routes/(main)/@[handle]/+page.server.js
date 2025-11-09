import { create_api } from '$lib/supabase/api';

export async function load({ params, parent, locals: { supabase } }) {
	const api = create_api(supabase);
	const { handle } = params;

	const { user: current_user } = await parent();

	// 필수 데이터만 서버에서 로드 (사용자 정보와 게시물)
	const user = await api.users.select_by_handle(handle);
	const posts = await api.posts.select_by_user_id(user.id, 10);

	return { user, posts };
}
