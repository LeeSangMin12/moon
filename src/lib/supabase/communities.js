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
	select_infinite_scroll: async (last_community_id, user_id = null) => {
		console.log('[select_infinite_scroll] Called with user_id:', user_id);

		let query = supabase
			.from('communities')
			.select('id, title, slug, content, avatar_url, created_at, creator_id')
			.order('id', { ascending: false })
			.limit(10);

		if (last_community_id !== '') {
			query = query.lt('id', last_community_id);
		}

		let { data: communities, error } = await query;

		if (error)
			throw new Error(`Failed to select_communities: ${error.message}`);

		if (!communities || communities.length === 0) {
			return [];
		}

		console.log('[select_infinite_scroll] Fetched communities:', communities.length);

		// Get member counts and membership info for all communities
		const community_ids = communities.map(c => c.id);
		const { data: members, error: members_error } = await supabase
			.from('community_members')
			.select('community_id, user_id')
			.in('community_id', community_ids);

		if (members_error)
			throw new Error(`Failed to select_community_members: ${members_error.message}`);

		console.log('[select_infinite_scroll] Fetched members:', members?.length);
		console.log('[select_infinite_scroll] Members data:', JSON.stringify(members, null, 2));

		// Create a map of community_id -> member info
		const member_map = {};
		members?.forEach(member => {
			if (!member_map[member.community_id]) {
				member_map[member.community_id] = [];
			}
			member_map[member.community_id].push(member.user_id);
		});

		console.log('[select_infinite_scroll] Member map:', JSON.stringify(member_map, null, 2));

		// Add is_member and member_count to each community
		communities = communities.map(community => {
			const community_member_ids = member_map[community.id] || [];
			const is_member = user_id ? community_member_ids.includes(user_id) : false;

			console.log(`[select_infinite_scroll] Community ${community.id}:`, {
				member_ids: community_member_ids,
				user_id,
				is_member
			});

			return {
				...community,
				is_member,
				member_count: community_member_ids.length,
				community_members: [{ count: community_member_ids.length }] // For backward compatibility
			};
		});

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
