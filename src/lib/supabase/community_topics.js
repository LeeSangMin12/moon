/**
 * 커뮤니티 토픽 API
 * @param {import('@supabase/supabase-js').SupabaseClient} supabase - Supabase 클라이언트
 * @returns {Object} 커뮤니티 토픽 API 메서드
 */
export const create_community_topics_api = (supabase) => ({
	/**
	 * 커뮤니티에 토픽 추가
	 * @param {string} community_id - 커뮤니티 ID
	 * @param {Array<{id: string}>} selected_topics - 선택된 토픽 목록
	 * @returns {Promise<void>}
	 */
	insert: async (community_id, selected_topics) => {
		const rows = selected_topics.map((topic) => ({
			community_id,
			topic_id: topic.id,
		}));

		const { error } = await supabase.from('community_topics').insert(rows);

		if (error) throw new Error(`Failed to add community topics: ${error.message}`);
	},

	/**
	 * 커뮤니티의 모든 토픽 삭제
	 * @param {string} community_id - 커뮤니티 ID
	 * @returns {Promise<void>}
	 */
	delete_by_community_id: async (community_id) => {
		const { error } = await supabase
			.from('community_topics')
			.delete()
			.eq('community_id', community_id);

		if (error) throw new Error(`Failed to delete community topics: ${error.message}`);
	},
});
