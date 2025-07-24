export const create_communities_api = (supabase) => ({
	select_by_search: async (search_text) => {
		const { data: communities, error } = await supabase
			.from('communities')
			.select('*, community_members(count)')
			.ilike('title', `%${search_text}%`)
			.order('created_at', { ascending: false });

		if (error) throw new Error(`Failed to select_by_search: ${error.message}`);

		return communities;
	},
	select_infinite_scroll: async (last_community_id) => {
		let query = supabase
			.from('communities')
			.select('*, community_members(count)')
			.order('created_at', { ascending: false }) // 최신순 정렬
			.limit(20);

		if (last_community_id !== '') {
			query.lt('id', last_community_id);
		}

		let { data: communities, error } = await query;

		if (error)
			throw new Error(`Failed to select_communities: ${error.message}`);

		return communities;
	},
	select_by_slug: async (slug) => {
		let { data: community, error } = await supabase
			.from('communities')
			.select('*, community_members(count)')
			.eq('slug', slug)
			.maybeSingle();

		if (error) throw new Error(`Failed to select_by_slug: ${error.message}`);

		return community;
	},
	select_by_slug_with_topics: async (slug) => {
		let { data: community, error } = await supabase
			.from('communities')
			.select('*, community_members(count), community_topics(*, topics(*))')
			.eq('slug', slug)
			.maybeSingle();

		if (error)
			throw new Error(`Failed to select_by_slug_with_topics: ${error.message}`);

		return community;
	},
	insert: async (data) => {
		let { data: communities, error } = await supabase
			.from('communities')
			.insert([data])
			.select()
			.single();

		if (error)
			throw new Error(`Failed to insert_communities: ${error.message}`);

		return communities;
	},
	update: async (community_id, data) => {
		let { error } = await supabase
			.from('communities')
			.update(data)
			.eq('id', community_id);

		if (error)
			throw new Error(`Failed to update_communities: ${error.message}`);
	},

	select_by_user_id: async (user_id) => {
		const { data, error } = await supabase
			.from('communities')
			.select('*, community_members(count)')
			.order('created_at', { ascending: false }) // 최신순 정렬
			.eq('creator_id', user_id);

		if (error) throw new Error(`Failed to select_by_user_id: ${error.message}`);
		return data;
	},
});
