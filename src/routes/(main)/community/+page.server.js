import { create_api } from '$lib/supabase/api';

export async function load({ params, parent, locals: { supabase } }) {
	const api = create_api(supabase);

	const { user } = await parent();

	console.log('[Community Page] User ID:', user?.id);

	// 필수 데이터만 서버에서 로드
	const communities = await api.communities.select_infinite_scroll('', user?.id);

	console.log('[Community Page] Communities loaded:', communities?.length);
	console.log('[Community Page] First community is_member:', communities?.[0]?.is_member);

	return {
		communities,
	};
}
