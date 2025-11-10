/**
 * 서비스 API
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase - Supabase 클라이언트
 * @returns {Object} 서비스 API 메서드
 */
export const create_services_api = (supabase) => ({
	/**
	 * 서비스 생성
	 * @param {Object} service - 서비스 데이터
	 * @returns {Promise<Object>} 생성된 서비스 ID
	 */
	insert: async (service) => {
		const { data, error } = await supabase
			.from('services')
			.insert(service)
			.select('id')
			.maybeSingle();

		if (error) throw new Error(`Failed to create service: ${error.message}`);

		return data;
	},

	/**
	 * 서비스 업데이트
	 * @param {string} id - 서비스 ID
	 * @param {Object} service - 업데이트할 데이터
	 * @returns {Promise<Object>} 업데이트된 데이터
	 */
	update: async (id, service) => {
		const { data, error } = await supabase
			.from('services')
			.update(service)
			.eq('id', id);

		if (error) throw new Error(`Failed to update service: ${error.message}`);

		return data;
	},

	/**
	 * 서비스 삭제
	 * @param {string} id - 서비스 ID
	 * @returns {Promise<void>}
	 */
	delete: async (id) => {
		const { error } = await supabase.from('services').delete().eq('id', id);

		if (error) throw new Error(`Failed to delete service: ${error.message}`);
	},

	/**
	 * 모든 서비스 조회
	 * @returns {Promise<Array>} 서비스 목록
	 */
	select: async () => {
		const { data, error } = await supabase.from('services').select('*');

		if (error) throw new Error(`Failed to fetch services: ${error.message}`);

		return data || [];
	},

	/**
	 * 제목으로 서비스 검색
	 * @param {string} search_text - 검색어
	 * @returns {Promise<Array>} 검색된 서비스 목록
	 */
	select_by_search: async (search_text) => {
		const { data, error } = await supabase
			.from('services')
			.select('*')
			.ilike('title', `%${search_text}%`)
			.order('created_at', { ascending: false });

		if (error) throw new Error(`Failed to search services: ${error.message}`);

		return data || [];
	},

	/**
	 * 무한 스크롤 방식으로 서비스 목록 조회
	 * @param {string} last_service_id - 마지막 서비스 ID (페이지네이션)
	 * @param {number} limit - 조회 개수 (기본 20)
	 * @returns {Promise<Array>} 서비스 목록
	 */
	select_infinite_scroll: async (last_service_id, limit = 20) => {
		let query = supabase
			.from('services')
			.select('id, title, author_id, images, created_at, price, rating, rating_count')
			.order('created_at', { ascending: false })
			.limit(limit);

		if (last_service_id) {
			query = query.lt('id', last_service_id);
		}

		const { data, error } = await query;

		if (error) throw new Error(`Failed to fetch services: ${error.message}`);

		return data || [];
	},

	/**
	 * ID로 서비스 상세 조회
	 * @param {string} id - 서비스 ID
	 * @returns {Promise<Object>} 서비스 상세 정보 (작성자 정보 포함)
	 */
	select_by_id: async (id) => {
		const { data, error } = await supabase
			.from('services')
			.select('*, users:author_id(id, name, avatar_url, handle)')
			.eq('id', id);

		if (error) throw new Error(`Failed to fetch service: ${error.message}`);

		return data?.[0];
	},

	/**
	 * 특정 사용자가 작성한 서비스 목록 조회
	 * @param {string} user_id - 사용자 ID
	 * @returns {Promise<Array>} 서비스 목록 (작성자 정보 포함)
	 */
	select_by_user_id: async (user_id) => {
		const { data, error } = await supabase
			.from('services')
			.select('*, users:author_id(id, name, avatar_url, handle)')
			.eq('author_id', user_id)
			.order('created_at', { ascending: false });

		if (error) throw new Error(`Failed to fetch user services: ${error.message}`);

		return data || [];
	},
});
