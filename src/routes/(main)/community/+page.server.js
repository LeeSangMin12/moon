import { create_api } from '$lib/supabase/api';

/**
 * 커뮤니티 목록 페이지 서버 로드 함수
 *
 * @param {Object} context - SvelteKit 로드 컨텍스트
 * @param {Function} context.parent - 부모 레이아웃 데이터 접근 함수
 * @param {Object} context.locals - 서버 사이드 로컬 데이터
 * @param {Object} context.locals.supabase - Supabase 클라이언트 인스턴스
 *
 * @returns {Promise<{communities: Array}>} 커뮤니티 목록을 포함한 페이지 데이터
 */
export async function load({ parent, locals: { supabase } }) {
	const api = create_api(supabase);
	const { user } = await parent();

	const communities = await api.communities.select_infinite_scroll('', user?.id);

	return { communities };
}
