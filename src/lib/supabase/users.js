export const create_users_api = (supabase) => ({
	/**
	 * ID로 사용자 조회
	 *
	 * @param {string} user_id - 사용자 ID (UUID)
	 * @returns {Promise<Object|null>} 사용자 객체 또는 null
	 */
	select: async (user_id) => {
		const { data, error } = await supabase
			.from('users')
			.select('*')
			.eq('id', user_id);

		if (error) throw new Error(`Failed to select: ${error.message}`);
		return data?.[0] || null;
	},

	/**
	 * Handle 중복 확인 (회원가입 시 사용)
	 *
	 * @param {string} handle - 확인할 핸들
	 * @returns {Promise<boolean>} 중복 여부 (true: 이미 존재, false: 사용 가능)
	 * @throws {Error} 쿼리 실패 시
	 */
	check_handle_exists: async (handle) => {
		const { data, error } = await supabase
			.from('users')
			.select('handle')
			.eq('handle', handle)
			.maybeSingle();

		if (error)
			throw new Error(`Failed to check_handle_exists: ${error.message}`);
		return !!data;
	},

	/**
	 * Handle로 사용자 조회
	 *
	 * @param {string} handle - 사용자 핸들
	 * @returns {Promise<Object|null>} 사용자 객체 또는 null
	 * @throws {Error} 쿼리 실패 시
	 */
	select_by_handle: async (handle) => {
		const { data, error } = await supabase
			.from('users')
			.select('*')
			.eq('handle', handle)
			.maybeSingle();

		if (error) throw new Error(`Failed to select_by_handle: ${error.message}`);
		return data || null;
	},

	/**
	 * 사용자 검색 (handle 또는 name으로)
	 *
	 * @param {string} search_text - 검색어
	 * @returns {Promise<Object[]>} 검색 결과 배열 (최대 20개)
	 * @throws {Error} 쿼리 실패 시
	 */
	select_by_search: async (search_text) => {
		const { data, error } = await supabase
			.from('users')
			.select('id, handle, name, avatar_url, self_introduction, created_at')
			.or(`handle.ilike.%${search_text}%,name.ilike.%${search_text}%`)
			.order('id', { ascending: false })
			.limit(20);

		if (error) throw new Error(`Failed to select_by_search: ${error.message}`);
		return data || [];
	},

	/**
	 * 사용자 정보 업데이트
	 *
	 * @param {string} user_id - 사용자 ID (UUID)
	 * @param {Object} update_data - 업데이트할 데이터
	 * @returns {Promise<void>}
	 * @throws {Error} 업데이트 실패 시
	 */
	update: async (user_id, update_data) => {
		const { error } = await supabase
			.from('users')
			.update(update_data)
			.eq('id', user_id);

		if (error) throw new Error(`Failed to update: ${error.message}`);
	},

	/**
	 * 사용자 정보 upsert (없으면 insert, 있으면 update)
	 *
	 * @param {string} user_id - 사용자 ID (UUID)
	 * @param {Object} user_data - 저장할 데이터
	 * @returns {Promise<void>}
	 * @throws {Error} upsert 실패 시
	 */
	upsert: async (user_id, user_data) => {
		const { error } = await supabase
			.from('users')
			.upsert({ id: user_id, ...user_data }, { onConflict: 'id' });

		if (error) throw new Error(`Failed to upsert: ${error.message}`);
	},

	/**
	 * 문 포인트 선물하기 (RPC 함수 호출)
	 *
	 * @param {string} sender_id - 보내는 사람 ID
	 * @param {string} receiver_id - 받는 사람 ID
	 * @param {number} amount - 선물할 포인트 양
	 * @returns {Promise<void>}
	 * @throws {Error} RPC 호출 실패 시
	 */
	gift_moon: async (sender_id, receiver_id, amount) => {
		const { error } = await supabase.rpc('gift_moon', {
			sender_id_in: sender_id,
			receiver_id_in: receiver_id,
			amount_in: amount,
		});

		if (error) throw new Error(`Failed to gift_moon: ${error.message}`);
	},
});
