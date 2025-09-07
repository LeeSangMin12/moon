export async function load({ locals: { supabase, session } }) {
	// 로그인하지 않은 경우 빈 데이터 반환
	if (!session?.user?.id) {
		return {
			received_chats: [],
			sent_chats: []
		};
	}

	try {
		// 받은 커피챗과 보낸 커피챗을 병렬로 조회
		const [received_chats_result, sent_chats_result] = await Promise.all([
			supabase
				.from('coffee_chats')
				.select(`
					*,
					sender:sender_id(id, name, handle, avatar_url)
				`)
				.eq('recipient_id', session.user.id)
				.order('created_at', { ascending: false }),
			
			supabase
				.from('coffee_chats')
				.select(`
					*,
					recipient:recipient_id(id, name, handle, avatar_url)
				`)
				.eq('sender_id', session.user.id)
				.order('created_at', { ascending: false })
		]);

		return {
			received_chats: received_chats_result.data || [],
			sent_chats: sent_chats_result.data || []
		};
	} catch (error) {
		console.error('Error loading coffee chats:', error);
		return {
			received_chats: [],
			sent_chats: []
		};
	}
}