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
	},
	select_list: async (user_id, limit = 50) => {
		const { data, error } = await supabase
			.from('notifications')
			.select(
				`
                *,
                actor:actor_id(id, handle, name, avatar_url)
            `,
			)
			.eq('recipient_id', user_id)
			.order('created_at', { ascending: false })
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
