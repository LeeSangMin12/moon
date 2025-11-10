import { create_api } from '$lib/supabase/api';

/**
 * 좋아요한 서비스 페이지 서버 로드 함수
 *
 * @param {Object} context - SvelteKit 로드 컨텍스트
 * @param {Object} context.params - URL 파라미터
 * @param {Function} context.parent - 부모 레이아웃 데이터 접근 함수
 * @param {Object} context.locals - 서버 사이드 로컬 데이터
 * @param {Object} context.locals.supabase - Supabase 클라이언트 인스턴스
 *
 * @returns {Promise<{services: Array, service_likes: Array}>} 좋아요한 서비스 및 좋아요 목록
 *
 * @description
 * 사용자가 좋아요한 서비스 정보를 조회하여 반환합니다.
 *
 * **성능 최적화:**
 * - 필요한 컬럼만 선택하여 데이터 전송량 최소화 (id, title, images, price, rating, rating_count)
 * - 중복 쿼리 제거: services 쿼리에서 이미 service_id를 포함하므로 별도 쿼리 불필요
 * - service_likes는 services 배열에서 추출하여 클라이언트 상태 관리에 사용
 */
export async function load({ params, parent, locals: { supabase } }) {
	const { user } = await parent();
	const api = create_api(supabase);

	const services = await api.service_likes.select_with_services_by_user_id(user.id);

	return {
		services,
		service_likes: services.map((s) => ({ service_id: s.service_id }))
	};
}
