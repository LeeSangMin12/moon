<script>
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { RiArrowLeftSLine } from 'svelte-remixicon';

	import Header from '$lib/components/ui/Header.svelte';
	import Post from '$lib/components/Post.svelte';

	import colors from '$lib/config/colors';
	import { get_user_context, get_api_context } from '$lib/contexts/app-context.svelte.js';
	import { createPostHandlers } from '$lib/composables/usePostHandlers.svelte.js';

	const { me } = get_user_context();
	const { api } = get_api_context();

	let { data } = $props();
	let { bookmarks } = $state(data);

	// 메인 페이지에서는 댓글 시스템이 없으므로 gift 댓글 추가 이벤트를 단순히 처리
	const handle_gift_comment_added = async (event) => {
		const { gift_content, gift_moon_point, parent_comment_id, post_id } =
			event.detail;

		// 실제 댓글 추가 (메인 페이지에서는 UI에 표시되지 않지만 DB에는 저장됨)
		await api.post_comments.insert({
			post_id,
			user_id: me.id,
			content: gift_content,
			parent_comment_id,
			gift_moon_point,
		});
	};

	// Post 이벤트 핸들러 (composable 사용 - 북마크 구조에 맞게 변환)
	const { handle_bookmark_changed: handle_bookmark_changed_base, handle_vote_changed: handle_vote_changed_base } = createPostHandlers(
		() => bookmarks.map(b => b.post).filter(Boolean),  // post 배열만 추출
		(updated_posts) => {
			// 업데이트된 post들을 bookmarks 구조에 다시 매핑
			bookmarks = bookmarks.map(b => {
				const updated_post = updated_posts.find(p => p.id === b.post?.id);
				return updated_post ? { ...b, post: updated_post } : b;
			});
		},
		me
	);

	const handle_bookmark_changed = handle_bookmark_changed_base;
	const handle_vote_changed = handle_vote_changed_base;
</script>

<svelte:head>
	<title>북마크 | 문</title>
	<meta
		name="description"
		content="내가 북마크한 게시물 목록을 한눈에 확인하고, 관심 있는 콘텐츠를 쉽게 관리"
	/>
</svelte:head>

<Header>
	<div slot="left">
		<button onclick={() => goto(`/@${me.handle}/accounts`)}>
			<RiArrowLeftSLine size={24} color={colors.gray[800]} />
		</button>
	</div>
	<h1 slot="center" class="font-semibold">북마크</h1>
</Header>

<main>
	{#each bookmarks as bookmark}
		{#if bookmark.post}
			<div class="mt-4">
				<Post
					post={bookmark.post}
					onGiftCommentAdded={handle_gift_comment_added}
				onBookmarkChanged={handle_bookmark_changed}
				onVoteChanged={handle_vote_changed}
				/>
			</div>
		{/if}
	{/each}
</main>
