export const create_user_follows_api = (supabase) => ({
	follow: async (follower_id, following_id) => {
		const { error } = await supabase
			.from('user_follows')
			.insert({ follower_id, following_id });
		if (error) throw new Error(error.message);
	},
	unfollow: async (follower_id, following_id) => {
		const { error } = await supabase
			.from('user_follows')
			.delete()
			.eq('follower_id', follower_id)
			.eq('following_id', following_id);
		if (error) throw new Error(error.message);
	},
	is_following: async (follower_id, following_id) => {
		const { data, error } = await supabase
			.from('user_follows')
			.select('*')
			.eq('follower_id', follower_id)
			.eq('following_id', following_id);

		if (error) throw new Error(error.message);
		return data?.length > 0 ? true : false;
	},
	select_user_follows: async (user_id) => {
		const { data, error } = await supabase
			.from('user_follows')
			.select('following_id')
			.eq('follower_id', user_id);
		if (error) throw new Error(error.message);

		return data;
	},
	select_user_followers: async (user_id) => {
		const { data, error } = await supabase
			.from('user_follows')
			.select('follower_id')
			.eq('following_id', user_id);
		if (error) throw new Error(error.message);

		return data;
	},

	get_follower_count: async (user_id) => {
		const { count } = await supabase
			.from('user_follows')
			.select('*', { count: 'exact', head: true })
			.eq('following_id', user_id);
		return count ?? 0;
	},
	get_following_count: async (user_id) => {
		const { count } = await supabase
			.from('user_follows')
			.select('*', { count: 'exact', head: true })
			.eq('follower_id', user_id);
		return count ?? 0;
	},

	select_followers: async (user_id) => {
		const { data, error } = await supabase
			.from('user_follows')
			.select('*, user:follower_id(id, handle, avatar_url)')
			.eq('following_id', user_id);
		if (error) throw new Error(error.message);

		return data;
	},
	select_followings: async (user_id) => {
		const { data, error } = await supabase
			.from('user_follows')
			.select('*, user:following_id(id, handle, avatar_url)')
			.eq('follower_id', user_id);
		if (error) throw new Error(error.message);
		return data;
	},
});
