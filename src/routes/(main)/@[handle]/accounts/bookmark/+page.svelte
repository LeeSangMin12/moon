<script>
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { RiArrowLeftSLine } from 'svelte-remixicon';

	import Header from '$lib/components/ui/Header/+page.svelte';
	import Post from '$lib/components/Post/+page.svelte';

	import colors from '$lib/js/colors';
	import { api_store } from '$lib/store/api_store';
	import { user_store } from '$lib/store/user_store';

	let { data } = $props();
	let { bookmarks } = $state(data);

	// 메인 페이지에서는 댓글 시스템이 없으므로 gift 댓글 추가 이벤트를 단순히 처리
	const handle_gift_comment_added = async (event) => {
		const { gift_content, gift_moon_point, parent_comment_id, post_id } =
			event.detail;

		// 실제 댓글 추가 (메인 페이지에서는 UI에 표시되지 않지만 DB에는 저장됨)
		await $api_store.post_comments.insert({
			post_id,
			user_id: $user_store.id,
			content: gift_content,
			parent_comment_id,
			gift_moon_point,
		});
	};
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
		<button onclick={() => goto(`/@${$user_store.handle}/accounts`)}>
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
					on:gift_comment_added={handle_gift_comment_added}
				/>
			</div>
		{/if}
	{/each}
</main>
