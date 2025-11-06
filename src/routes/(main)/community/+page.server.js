import { create_api } from '$lib/supabase/api';

export async function load({ params, parent, locals: { supabase }, setHeaders }) {
	const api = create_api(supabase);

	const { user } = await parent();

	// 커뮤니티 목록은 공개 데이터이므로 캐시 활성화
	setHeaders({
		'Cache-Control': user?.id
			? 'private, max-age=60, must-revalidate'
			: 'public, max-age=300, stale-while-revalidate=600',
	});

	console.log('[Community Page] User ID:', user?.id);

	// 필수 데이터만 서버에서 로드
	const communities = await api.communities.select_infinite_scroll('', user?.id);

	console.log('[Community Page] Communities loaded:', communities?.length);
	console.log('[Community Page] First community is_member:', communities?.[0]?.is_member);

	return {
		communities,
	};
}
