export const create_user_bank_accounts_api = (supabase) => ({
	/**
	 * 사용자의 출금 계좌 목록 조회
	 */
	async select_by_user_id(user_id) {
		const { data, error } = await supabase
			.from('user_bank_accounts')
			.select('*')
			.eq('user_id', user_id)
			.order('is_default', { ascending: false })
			.order('created_at', { ascending: false });

		if (error) {
			throw new Error(`Failed to select bank accounts: ${error.message}`);
		}
		return data || [];
	},

	/**
	 * 기본 출금 계좌 조회
	 */
	async select_default_by_user_id(user_id) {
		const { data, error } = await supabase
			.from('user_bank_accounts')
			.select('*')
			.eq('user_id', user_id)
			.eq('is_default', true)
			.single();

		if (error && error.code !== 'PGRST116') {
			throw new Error(`Failed to select default bank account: ${error.message}`);
		}
		return data;
	},

	/**
	 * 출금 계좌 등록
	 */
	async insert({
		user_id,
		account_type = 'individual',
		bank,
		account_number,
		account_holder,
		resident_number,
		business_number,
	}) {
		// 기존 기본 계좌가 있으면 is_default를 false로 변경
		await supabase
			.from('user_bank_accounts')
			.update({ is_default: false })
			.eq('user_id', user_id)
			.eq('is_default', true);

		const { data, error } = await supabase
			.from('user_bank_accounts')
			.insert([
				{
					user_id,
					account_type,
					bank,
					account_number,
					account_holder,
					resident_number,
					business_number,
					is_default: true,
				},
			])
			.select()
			.single();

		if (error) {
			throw new Error(`Failed to insert bank account: ${error.message}`);
		}
		return data;
	},

	/**
	 * 출금 계좌 수정
	 */
	async update(id, updates) {
		const { data, error } = await supabase
			.from('user_bank_accounts')
			.update({ ...updates, updated_at: new Date().toISOString() })
			.eq('id', id)
			.select()
			.single();

		if (error) {
			throw new Error(`Failed to update bank account: ${error.message}`);
		}
		return data;
	},

	/**
	 * 기본 계좌로 설정
	 */
	async set_default(id, user_id) {
		// 기존 기본 계좌 해제
		await supabase
			.from('user_bank_accounts')
			.update({ is_default: false })
			.eq('user_id', user_id)
			.eq('is_default', true);

		// 새 기본 계좌 설정
		const { data, error } = await supabase
			.from('user_bank_accounts')
			.update({ is_default: true, updated_at: new Date().toISOString() })
			.eq('id', id)
			.select()
			.single();

		if (error) {
			throw new Error(`Failed to set default bank account: ${error.message}`);
		}
		return data;
	},

	/**
	 * 출금 계좌 삭제
	 */
	async delete(id) {
		const { error } = await supabase.from('user_bank_accounts').delete().eq('id', id);

		if (error) {
			throw new Error(`Failed to delete bank account: ${error.message}`);
		}
	},
});
