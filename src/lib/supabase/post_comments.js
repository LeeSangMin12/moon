export const create_post_comments_api = (supabase) => ({
	select_by_post_id: async (post_id, user_id) => {
		const { data, error } = await supabase
			.from('post_comments')
			.select(
				'id, content, created_at, updated_at, user_id, post_id, parent_comment_id, gift_amount, users:user_id(id, handle, name, avatar_url), post_comment_votes(vote, user_id)',
			)
			.eq('post_id', post_id)
			.order('id', { ascending: true });

		if (error) {
			throw new Error(`Failed to select_by_post_id: ${error.message}`);
		}

		// 데이터를 트리 구조로 재구성
		const comments_with_votes = data.map((comment) => {
			const upvotes = comment.post_comment_votes.filter(
				(v) => v.vote === 1,
			).length;
			const downvotes = comment.post_comment_votes.filter(
				(v) => v.vote === -1,
			).length;
			const user_vote =
				comment.post_comment_votes.find((v) => v.user_id === user_id)?.vote ||
				0;
			return { ...comment, upvotes, downvotes, user_vote };
		});

		const comments_by_id = {};
		const root_comments = [];

		for (const comment of comments_with_votes) {
			comments_by_id[comment.id] = { ...comment, replies: [] };
		}

		for (const comment_id in comments_by_id) {
			const comment = comments_by_id[comment_id];
			if (
				comment.parent_comment_id &&
				comments_by_id[comment.parent_comment_id]
			) {
				comments_by_id[comment.parent_comment_id].replies.push(comment);
			} else {
				root_comments.push(comment);
			}
		}

		return root_comments;
	},
	insert: async (comment_data) => {
		const { data, error } = await supabase
			.from('post_comments')
			.insert(comment_data)
			.select('*, users(id, handle, name, avatar_url)')
			.single();

		if (error) {
			throw new Error(`댓글 생성 실패: ${error.message}`);
		}

		return data;
	},
	update: async (comment_id, user_id, new_content) => {
		const { data, error } = await supabase
			.from('post_comments')
			.update({ content: new_content, updated_at: new Date() })
			.eq('id', comment_id)
			.eq('user_id', user_id)
			.select()
			.single();

		if (error) {
			throw new Error(`댓글 업데이트 실패: ${error.message}`);
		}
		return data;
	},
	delete: async (comment_id, user_id) => {
		const { error } = await supabase
			.from('post_comments')
			.delete()
			.eq('id', comment_id)
			.eq('user_id', user_id);

		if (error) {
			throw new Error(`댓글 삭제 실패: ${error.message}`);
		}
		return true;
	},

	// 특정 사용자가 작성한 댓글 조회
	select_by_user_id: async (user_id) => {
		const { data, error } = await supabase
			.from('post_comments')
			.select(
				`
				*,
				users:user_id(id, handle, name, avatar_url),
				post:post_id(
					id, 
					title, 
					content,
					users:author_id(id, handle, name)
				),
				parent_comment:parent_comment_id(
					id,
					content,
					users:user_id(id, handle, name)
				)
			`,
			)
			.eq('user_id', user_id)
			.order('created_at', { ascending: false });

		if (error) {
			throw new Error(`Failed to select comments by user_id: ${error.message}`);
		}

		return data;
	},
});
