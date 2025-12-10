export const create_user_contacts_api = (supabase) => ({
	/**
	 * 사용자 ID로 연락처 조회
	 *
	 * @param {string} user_id - 사용자 ID (UUID)
	 * @returns {Promise<Object|null>} 연락처 객체 또는 null
	 */
	select_by_user_id: async (user_id) => {
		const { data, error } = await supabase
			.from('user_contacts')
			.select('*')
			.eq('user_id', user_id)
			.maybeSingle();

		if (error) throw new Error(`Failed to select user_contacts: ${error.message}`);
		return data;
	},

	/**
	 * 연락처 생성 또는 수정 (Upsert)
	 *
	 * @param {string} user_id - 사용자 ID (UUID)
	 * @param {Object} contact_data - 연락처 데이터
	 * @param {string} contact_data.contact_phone - 연락받을 전화번호 (필수)
	 * @param {string} [contact_data.contact_email] - 연락받을 이메일 (선택)
	 * @returns {Promise<Object>} 생성/수정된 연락처 객체
	 */
	upsert: async (user_id, contact_data) => {
		const { data, error } = await supabase
			.from('user_contacts')
			.upsert(
				{
					user_id,
					contact_phone: contact_data.contact_phone,
					contact_email: contact_data.contact_email || null,
					updated_at: new Date().toISOString(),
				},
				{ onConflict: 'user_id' }
			)
			.select()
			.single();

		if (error) throw new Error(`Failed to upsert user_contacts: ${error.message}`);
		return data;
	},
});
