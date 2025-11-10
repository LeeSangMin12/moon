import { create_api } from '$lib/supabase/api';

/**
 * 외주 페이지 서버 로드 함수
 * @param {Object} params - 로드 파라미터
 * @param {Object} params.locals - SvelteKit locals
 * @param {Object} params.locals.supabase - Supabase 클라이언트
 * @returns {Promise<Object>} 외주 요청 데이터
 */
export async function load({ locals: { supabase } }) {
	const api = create_api(supabase);

	// 두 job_type의 데이터를 병렬로 로드 (SSR 최적화)
	const [sidejob_requests, fulltime_requests] = await Promise.all([
		api.expert_requests
			.select_infinite_scroll('', '', 10, 'sidejob')
			.then((res) => res.data || res),
		api.expert_requests
			.select_infinite_scroll('', '', 10, 'fulltime')
			.then((res) => res.data || res),
	]);

	return {
		sidejob_requests,
		fulltime_requests,
	};
}
