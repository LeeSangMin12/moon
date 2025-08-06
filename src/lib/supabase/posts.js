export const create_posts_api = (supabase) => ({
	select_by_search: async (search_text) => {
		const { data: posts, error } = await supabase
			.from('posts')
			.select(
				'*, users:author_id(id, handle, name, avatar_url), communities(id, title, slug), post_votes(user_id, vote), post_bookmarks(user_id), post_comments(count)',
			)
			.ilike('title', `%${search_text}%`) // 변경된 부분
			.order('created_at', { ascending: false });

		if (error) throw new Error(`Failed to select_by_search: ${error.message}`);

		return posts;
	},
	select_infinite_scroll: async (last_post_id, community_id, limit = 20) => {
		let query = supabase
			.from('posts')
			.select(
				'*, users:author_id(id, handle, name, avatar_url), communities(id, title, slug), post_votes(user_id, vote), post_bookmarks(user_id), post_comments(count)',
			)
			.order('created_at', { ascending: false }) // 최신순 정렬
			.limit(limit);

		if (community_id !== '') {
			query = query.eq('community_id', community_id);
		}

		if (last_post_id !== '') {
			query = query.lt('id', last_post_id);
		}

		let { data: posts, error } = await query;

		if (error)
			throw new Error(`Failed to select_infinite_scroll: ${error.message}`);

		return posts;
	},
	select_by_id: async (post_id) => {
		const { data, error } = await supabase
			.from('posts')
			.select(
				'*, users:author_id(id, handle, name, avatar_url), communities(id, title, slug), post_votes(user_id, vote), post_bookmarks(user_id), post_comments(count)',
			)
			.eq('id', post_id)
			.single();

		if (error) throw new Error(`Failed to select_by_id: ${error.message}`);

		return data;
	},
	select_by_community_id: async (community_id) => {
		const { data, error } = await supabase
			.from('posts')
			.select(
				'*, users:author_id(id, handle, name, avatar_url), communities(id, title, slug), post_votes(user_id, vote), post_bookmarks(user_id), post_comments(count)',
			)
			.eq('community_id', community_id);

		if (error)
			throw new Error(`Failed to select_by_community_id: ${error.message}`);

		return data;
	},
	select_by_user_id: async (user_id) => {
		const { data, error } = await supabase
			.from('posts')
			.select(
				'*, users:author_id(id, handle, name, avatar_url), communities(id, title, slug), post_votes(user_id, vote), post_bookmarks(user_id), post_comments(count)',
			)
			.eq('author_id', user_id);

		if (error) throw new Error(`Failed to select_by_user_id: ${error.message}`);

		return data;
	},
	insert: async (post_data) => {
		const { data, error } = await supabase
			.from('posts')
			.insert(post_data)
			.select('id')
			.single();

		if (error) {
			throw new Error(`게시글 생성 실패: ${error.message}`);
		}

		return data;
	},
	update: async (post_id, post_data) => {
		const { data, error } = await supabase
			.from('posts')
			.update(post_data)
			.eq('id', post_id)
			.select()
			.single();

		if (error) {
			throw new Error(`게시글 업데이트 실패: ${error.message}`);
		}

		return data;
	},
	select_random: async (community_id = '', limit = 20, exclude_ids = []) => {
		let query = supabase
			.from('posts')
			.select(
				'*, users:author_id(id, handle, name, avatar_url), communities(id, title, slug), post_votes(user_id, vote), post_bookmarks(user_id), post_comments(count)',
			)
			.order('created_at', { ascending: false })
			.limit(limit * 2); // Get more posts to account for filtering

		if (community_id !== '') {
			query = query.eq('community_id', community_id);
		}

		// Exclude posts that are already loaded
		if (exclude_ids.length > 0) {
			query = query.not('id', 'in', `(${exclude_ids.join(',')})`);
		}

		let { data: posts, error } = await query;

		if (error) throw new Error(`Failed to select_random: ${error.message}`);

		// Shuffle the posts array to randomize the order
		const shuffled = posts.sort(() => Math.random() - 0.5);

		// Return only the requested limit
		return shuffled.slice(0, limit);
	},
});
