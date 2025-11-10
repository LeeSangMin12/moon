/**
 * 커뮤니티 멤버 API
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase - Supabase 클라이언트
 * @returns {Object} 커뮤니티 멤버 API 메서드
 */
export const create_community_members_api = (supabase) => ({
	/**
	 * 사용자가 가입한 커뮤니티 목록 조회
	 * @param {string} user_id - 사용자 ID
	 * @returns {Promise<Array>} 커뮤니티 멤버 목록 (커뮤니티 정보 포함)
	 */
	select_by_user_id: async (user_id) => {
		if (!user_id) return [];

		const { data, error } = await supabase
			.from('community_members')
			.select('*, communities(*)')
			.eq('user_id', user_id);

		if (error) throw new Error(`Failed to fetch user communities: ${error.message}`);

		return data || [];
	},

	/**
	 * 커뮤니티에 가입한 멤버 목록 조회
	 * @param {string} community_id - 커뮤니티 ID
	 * @returns {Promise<Array>} 멤버 목록 (사용자 정보 포함)
	 */
	select_by_community_id: async (community_id) => {
		const { data, error } = await supabase
			.from('community_members')
			.select('*, users(id, name, handle, avatar_url)')
			.eq('community_id', community_id);

		if (error) throw new Error(`Failed to fetch community members: ${error.message}`);

		return data || [];
	},

	/**
	 * 커뮤니티 멤버 추가 (중복 시 업데이트)
	 * @param {string} community_id - 커뮤니티 ID
	 * @param {string} user_id - 사용자 ID
	 * @returns {Promise<void>}
	 */
	insert: async (community_id, user_id) => {
		const { error } = await supabase
			.from('community_members')
			.upsert({ community_id, user_id }, { onConflict: 'community_id,user_id' });

		if (error) throw new Error(`Failed to join community: ${error.message}`);
	},

	/**
	 * 커뮤니티 멤버 삭제 (탈퇴)
	 * @param {string} community_id - 커뮤니티 ID
	 * @param {string} user_id - 사용자 ID
	 * @returns {Promise<void>}
	 */
	delete: async (community_id, user_id) => {
		const { error } = await supabase
			.from('community_members')
			.delete()
			.eq('community_id', community_id)
			.eq('user_id', user_id);

		if (error) throw new Error(`Failed to leave community: ${error.message}`);
	},
});
