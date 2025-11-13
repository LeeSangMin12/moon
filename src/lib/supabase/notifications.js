export const create_notifications_api = (supabase) => ({
	insert: async ({
		recipient_id,
		actor_id = null,
		type,
		resource_type = null,
		resource_id = null,
		payload = null,
		link_url = null,
	}) => {
		// 1. 알림을 데이터베이스에 저장
		const { error } = await supabase.from('notifications').insert({
			recipient_id,
			actor_id,
			type,
			resource_type,
			resource_id,
			payload,
			link_url,
		});

		if (error)
			throw new Error(`Failed to insert notification: ${error.message}`);

		// 푸시 알림은 notifications.server.js에서 처리 (서버 전용)
	},
	select_list: async (user_id, limit = 50) => {
		const { data, error } = await supabase
			.from('notifications')
			.select(
				`
                id, type, resource_type, resource_id, payload, link_url, read_at, created_at,
                actor:actor_id(id, handle, name, avatar_url)
            `,
			)
			.eq('recipient_id', user_id)
			.order('id', { ascending: false })
			.limit(limit);

		if (error)
			throw new Error(`Failed to select notifications: ${error.message}`);
		return data || [];
	},

	select_unread_count: async (user_id) => {
		const { count, error } = await supabase
			.from('notifications')
			.select('*', { count: 'exact', head: true })
			.eq('recipient_id', user_id)
			.is('read_at', null);

		if (error)
			throw new Error(`Failed to count unread notifications: ${error.message}`);
		return count ?? 0;
	},

	mark_as_read: async (id, user_id) => {
		const { error } = await supabase
			.from('notifications')
			.update({ read_at: new Date() })
			.eq('id', id)
			.eq('recipient_id', user_id);

		if (error)
			throw new Error(`Failed to mark notification as read: ${error.message}`);
	},

	mark_all_as_read: async (user_id) => {
		const { error } = await supabase
			.from('notifications')
			.update({ read_at: new Date() })
			.eq('recipient_id', user_id)
			.is('read_at', null);

		if (error) throw new Error(`Failed to mark all as read: ${error.message}`);
	},
});
