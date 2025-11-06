import { create_api } from '$lib/supabase/api';

export const load = async ({ parent, locals: { supabase }, setHeaders }) => {
	const api = create_api(supabase);

	const { user } = await parent();

	// 게시물은 공개 데이터이므로 캐시 활성화
	setHeaders({
		'Cache-Control': user?.id
			? 'private, max-age=30, must-revalidate'
			: 'public, max-age=60, stale-while-revalidate=300',
	});

	// 필수 데이터만 서버에서 로드 (초기 게시물만)
	const posts = await api.posts.select_infinite_scroll('', '', 10);

	return {
		posts,
	};
};
