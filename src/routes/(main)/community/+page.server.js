import { create_api } from '$lib/supabase/api';

export async function load({ params, parent, locals: { supabase }, setHeaders }) {
	const api = create_api(supabase);

	// 사용자별 데이터(참여 상태)가 포함되므로 캐시 비활성화
	setHeaders({
		'Cache-Control': 'private, max-age=0, must-revalidate',
	});

	const { user } = await parent();

	console.log('[Community Page] User ID:', user?.id);

	const [communities, community_members] = await Promise.all([
		api.communities.select_infinite_scroll('', user?.id),
		user?.id ? api.community_members.select_by_user_id(user.id) : Promise.resolve([])
	]);

	console.log('[Community Page] Communities loaded:', communities?.length);
	console.log('[Community Page] First community is_member:', communities?.[0]?.is_member);

	return {
		communities,
		community_members,
	};
}
