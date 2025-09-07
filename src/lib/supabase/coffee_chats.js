export const create_coffee_chats_api = (supabase) => ({
	/**
	 * 커피챗 요청 생성
	 */
	async insert(coffee_chat_data) {
		const { data, error } = await supabase
			.from('coffee_chats')
			.insert([coffee_chat_data])
			.select('*')
			.single();

		if (error) {
			console.error('Error creating coffee chat:', error);
			throw error;
		}

		return data;
	},

	/**
	 * 특정 사용자가 받은 커피챗 요청 조회
	 */
	async select_received(user_id) {
		const { data, error } = await supabase
			.from('coffee_chats')
			.select(`
				*,
				sender:sender_id(id, name, handle, avatar_url)
			`)
			.eq('recipient_id', user_id)
			.order('created_at', { ascending: false });

		if (error) {
			console.error('Error fetching received coffee chats:', error);
			throw error;
		}

		return data || [];
	},

	/**
	 * 특정 사용자가 보낸 커피챗 요청 조회
	 */
	async select_sent(user_id) {
		const { data, error } = await supabase
			.from('coffee_chats')
			.select(`
				*,
				recipient:recipient_id(id, name, handle, avatar_url)
			`)
			.eq('sender_id', user_id)
			.order('created_at', { ascending: false });

		if (error) {
			console.error('Error fetching sent coffee chats:', error);
			throw error;
		}

		return data || [];
	},

	/**
	 * 커피챗 상태 업데이트
	 */
	async update_status(id, status) {
		const { data, error } = await supabase
			.from('coffee_chats')
			.update({ status, updated_at: new Date().toISOString() })
			.eq('id', id)
			.select('*')
			.single();

		if (error) {
			console.error('Error updating coffee chat status:', error);
			throw error;
		}

		return data;
	},

	/**
	 * 특정 커피챗 요청 조회
	 */
	async select_by_id(id) {
		const { data, error } = await supabase
			.from('coffee_chats')
			.select(`
				*,
				sender:sender_id(id, name, handle, avatar_url),
				recipient:recipient_id(id, name, handle, avatar_url)
			`)
			.eq('id', id)
			.single();

		if (error) {
			console.error('Error fetching coffee chat by id:', error);
			throw error;
		}

		return data;
	},

	/**
	 * 커피챗 요청 삭제
	 */
	async delete(id) {
		const { error } = await supabase
			.from('coffee_chats')
			.delete()
			.eq('id', id);

		if (error) {
			console.error('Error deleting coffee chat:', error);
			throw error;
		}

		return true;
	}
});