import { has_invalid_args } from '$lib/utils/common';

/**
 * 서비스 좋아요 API
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase - Supabase 클라이언트
 * @returns {Object} 서비스 좋아요 API 메서드
 */
export const create_service_likes_api = (supabase) => ({
	/**
	 * 사용자가 좋아요한 서비스 ID 목록 조회
	 * @param {string} user_id - 사용자 ID
	 * @returns {Promise<Array<{service_id: string}>>} 좋아요한 서비스 ID 목록
	 */
	select_by_user_id: async (user_id) => {
		if (has_invalid_args([user_id])) return [];

		const { data, error } = await supabase
			.from('service_likes')
			.select('service_id')
			.eq('user_id', user_id);

		if (error) throw new Error(`Failed to fetch service likes: ${error.message}`);

		return data || [];
	},

	/**
	 * 사용자가 좋아요한 서비스 목록 조회 (서비스 정보 포함)
	 * @param {string} user_id - 사용자 ID
	 * @returns {Promise<Array<{service_id: string, services: Object}>>} 좋아요한 서비스 목록
	 */
	select_with_services_by_user_id: async (user_id) => {
		if (has_invalid_args([user_id])) return [];

		const { data, error } = await supabase
			.from('service_likes')
			.select('service_id, services(id, title, images, price, rating, rating_count)')
			.eq('user_id', user_id);

		if (error) throw new Error(`Failed to fetch liked services: ${error.message}`);

		return data || [];
	},

	/**
	 * 서비스 좋아요 추가 (중복 시 업데이트)
	 * @param {string} service_id - 서비스 ID
	 * @param {string} user_id - 사용자 ID
	 * @returns {Promise<void>}
	 */
	insert: async (service_id, user_id) => {
		const { error } = await supabase
			.from('service_likes')
			.upsert({ service_id, user_id }, { onConflict: 'service_id,user_id' });

		if (error) throw new Error(`Failed to like service: ${error.message}`);
	},

	/**
	 * 서비스 좋아요 삭제
	 * @param {string} service_id - 서비스 ID
	 * @param {string} user_id - 사용자 ID
	 * @returns {Promise<void>}
	 */
	delete: async (service_id, user_id) => {
		const { error } = await supabase
			.from('service_likes')
			.delete()
			.eq('service_id', service_id)
			.eq('user_id', user_id);

		if (error) throw new Error(`Failed to unlike service: ${error.message}`);
	},
});
