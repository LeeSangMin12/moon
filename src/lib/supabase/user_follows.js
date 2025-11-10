/**
 * 사용자 팔로우 API
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase - Supabase 클라이언트
 * @returns {Object} 사용자 팔로우 API 메서드
 */
export const create_user_follows_api = (supabase) => ({
	/**
	 * 사용자 팔로우
	 * @param {string} follower_id - 팔로우하는 사용자 ID
	 * @param {string} following_id - 팔로우 대상 사용자 ID
	 * @returns {Promise<void>}
	 */
	follow: async (follower_id, following_id) => {
		const { error } = await supabase
			.from('user_follows')
			.insert({ follower_id, following_id });

		if (error) throw new Error(`Failed to follow user: ${error.message}`);
	},

	/**
	 * 사용자 언팔로우
	 * @param {string} follower_id - 팔로우하는 사용자 ID
	 * @param {string} following_id - 언팔로우할 사용자 ID
	 * @returns {Promise<void>}
	 */
	unfollow: async (follower_id, following_id) => {
		const { error } = await supabase
			.from('user_follows')
			.delete()
			.eq('follower_id', follower_id)
			.eq('following_id', following_id);

		if (error) throw new Error(`Failed to unfollow user: ${error.message}`);
	},

	/**
	 * 팔로우 여부 확인
	 * @param {string} follower_id - 팔로우하는 사용자 ID
	 * @param {string} following_id - 확인할 사용자 ID
	 * @returns {Promise<boolean>} 팔로우 여부
	 */
	is_following: async (follower_id, following_id) => {
		const { data, error } = await supabase
			.from('user_follows')
			.select('*')
			.eq('follower_id', follower_id)
			.eq('following_id', following_id);

		if (error) throw new Error(`Failed to check follow status: ${error.message}`);

		return (data?.length ?? 0) > 0;
	},

	/**
	 * 사용자가 팔로우하는 목록 조회 (ID만)
	 * @param {string} user_id - 사용자 ID
	 * @returns {Promise<Array>} 팔로잉 ID 목록
	 */
	select_user_follows: async (user_id) => {
		const { data, error } = await supabase
			.from('user_follows')
			.select('following_id')
			.eq('follower_id', user_id);

		if (error) throw new Error(`Failed to fetch following list: ${error.message}`);

		return data || [];
	},

	/**
	 * 사용자를 팔로우하는 목록 조회 (ID만)
	 * @param {string} user_id - 사용자 ID
	 * @returns {Promise<Array>} 팔로워 ID 목록
	 */
	select_user_followers: async (user_id) => {
		const { data, error } = await supabase
			.from('user_follows')
			.select('follower_id')
			.eq('following_id', user_id);

		if (error) throw new Error(`Failed to fetch followers list: ${error.message}`);

		return data || [];
	},

	/**
	 * 팔로워 수 조회
	 * @param {string} user_id - 사용자 ID
	 * @returns {Promise<number>} 팔로워 수
	 */
	get_follower_count: async (user_id) => {
		const { count } = await supabase
			.from('user_follows')
			.select('*', { count: 'exact', head: true })
			.eq('following_id', user_id);

		return count ?? 0;
	},

	/**
	 * 팔로잉 수 조회
	 * @param {string} user_id - 사용자 ID
	 * @returns {Promise<number>} 팔로잉 수
	 */
	get_following_count: async (user_id) => {
		const { count } = await supabase
			.from('user_follows')
			.select('*', { count: 'exact', head: true })
			.eq('follower_id', user_id);

		return count ?? 0;
	},

	/**
	 * 팔로워 목록 조회 (사용자 정보 포함)
	 * @param {string} user_id - 사용자 ID
	 * @returns {Promise<Array>} 팔로워 목록
	 */
	select_followers: async (user_id) => {
		const { data, error } = await supabase
			.from('user_follows')
			.select('*, user:follower_id(id, handle, avatar_url)')
			.eq('following_id', user_id);

		if (error) throw new Error(`Failed to fetch followers: ${error.message}`);

		return data || [];
	},

	/**
	 * 팔로잉 목록 조회 (사용자 정보 포함)
	 * @param {string} user_id - 사용자 ID
	 * @returns {Promise<Array>} 팔로잉 목록
	 */
	select_followings: async (user_id) => {
		const { data, error } = await supabase
			.from('user_follows')
			.select('*, user:following_id(id, handle, avatar_url)')
			.eq('follower_id', user_id);

		if (error) throw new Error(`Failed to fetch followings: ${error.message}`);

		return data || [];
	},
});
