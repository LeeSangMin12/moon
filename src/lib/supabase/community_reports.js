/**
 * 커뮤니티 신고 API
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase - Supabase 클라이언트
 * @returns {Object} 커뮤니티 신고 API 메서드
 */
export const create_community_reports_api = (supabase) => ({
	/**
	 * 커뮤니티 신고 추가
	 * @param {Object} data - 신고 데이터
	 * @param {string} data.community_id - 신고할 커뮤니티 ID
	 * @param {string} data.user_id - 신고자 ID
	 * @param {string} data.reason - 신고 사유
	 * @returns {Promise<void>}
	 */
	insert: async (data) => {
		const { error } = await supabase.from('community_reports').insert(data);

		if (error) throw new Error(`Failed to report community: ${error.message}`);
	},
});
