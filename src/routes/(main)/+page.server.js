import { create_api } from '$lib/supabase/api';

export const load = async ({ parent, locals: { supabase } }) => {
	const api = create_api(supabase);

	const { user } = await parent();

	// 필수 데이터만 서버에서 로드 (초기 게시물만)
	const posts = await api.posts.select_infinite_scroll('', '', 20);

	return {
		posts,
	};
};
