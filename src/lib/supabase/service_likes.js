import { has_invalid_args } from '$lib/utils/common';

export const create_service_likes_api = (supabase) => ({
	select_by_user_id: async (user_id) => {
		if (has_invalid_args([user_id])) return [];

		const { data, error } = await supabase
			.from('service_likes')
			.select('service_id , services(*)')
			.eq('user_id', user_id);
		if (error) throw new Error(`Failed to select: ${error.message}`);

		return data;
	},
	insert: async (service_id, user_id) => {
		const { error } = await supabase
			.from('service_likes')
			.insert({ service_id, user_id });

		if (error) throw new Error(`Failed to insert: ${error.message}`);
	},
	delete: async (service_id, user_id) => {
		const { error } = await supabase
			.from('service_likes')
			.delete()
			.eq('service_id', service_id)
			.eq('user_id', user_id);

		if (error) throw new Error(`Failed to delete: ${error.message}`);
	},
});
