import { create_api } from '$lib/supabase/api';

/**
 * 커뮤니티 상세 페이지 서버 로드 함수
 *
 * @param {Object} context - SvelteKit 로드 컨텍스트
 * @param {Object} context.params - URL 파라미터
 * @param {string} context.params.slug - 커뮤니티 슬러그
 * @param {Function} context.parent - 부모 레이아웃 데이터 접근 함수
 * @param {Object} context.locals - 서버 사이드 로컬 데이터
 * @param {Object} context.locals.supabase - Supabase 클라이언트 인스턴스
 *
 * @returns {Promise<{
 *   community: Object,
 *   community_members: Array,
 *   posts: Array,
 *   community_participants: Array
 * }>} 커뮤니티 상세 페이지 데이터
 *
 * @description
 * 커뮤니티 정보와 게시물을 병렬로 조회하여 반환합니다.
 *
 * **성능 최적화:**
 * - Promise.all을 사용한 병렬 쿼리로 로딩 시간 단축
 * - 사용자 로그인 시에만 투표/북마크 데이터 조회
 * - 현재 페이지의 게시물에 대한 상호작용 데이터만 필터링하여 전송량 최소화
 * - Set을 사용한 O(1) 필터링으로 성능 향상
 */
export async function load({ params, parent, locals: { supabase } }) {
	const api = create_api(supabase);
	const { user } = await parent();

	const community = await api.communities.select_by_slug(params.slug);

	const [community_members, posts, community_participants] = await Promise.all([
		user?.id ? api.community_members.select_by_user_id(user.id) : Promise.resolve([]),
		api.posts.select_by_community_id(community.id, 10),
		api.community_members.select_by_community_id(community.id)
	]);

	let posts_with_interactions = posts;

	if (user?.id && posts.length > 0) {
		const [all_votes, all_bookmarks] = await Promise.all([
			api.post_votes.select_by_user_id(user.id),
			api.post_bookmarks.select_by_user_id_lightweight(user.id)
		]);

		const post_ids = new Set(posts.map((p) => p.id));
		const votes = all_votes.filter((v) => post_ids.has(v.post_id));
		const bookmarks = all_bookmarks.filter((b) => post_ids.has(b.post_id));

		posts_with_interactions = posts.map((post) => ({
			...post,
			post_votes: votes.filter((v) => v.post_id === post.id),
			post_bookmarks: bookmarks.filter((b) => b.post_id === post.id)
		}));
	}

	return {
		community,
		community_members,
		posts: posts_with_interactions,
		community_participants
	};
}
