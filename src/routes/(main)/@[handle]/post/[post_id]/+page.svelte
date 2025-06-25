<script>
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import {
		RiArrowDownSLine,
		RiArrowLeftSLine,
		RiArrowRightSLine,
		RiArrowUpLine,
		RiArrowUpSLine,
		RiBookmarkLine,
		RiMore2Fill,
	} from 'svelte-remixicon';

	import CustomCarousel from '$lib/components/ui/Carousel/+page.svelte';
	import CommentInput from '$lib/components/ui/CommentInput/+page.svelte';
	import Header from '$lib/components/ui/Header/+page.svelte';
	import Icon from '$lib/components/ui/Icon/+page.svelte';
	import Modal from '$lib/components/ui/Modal/+page.svelte';
	import Comment from '$lib/components/Comment/+page.svelte';
	import Post from '$lib/components/Post/+page.svelte';

	import colors from '$lib/js/colors';
	import { api_store } from '$lib/store/api_store';
	import { user_store } from '$lib/store/user_store';

	const TITLE = '게시글';

	let { data } = $props();
	let { post, comments } = $derived(data);

	onMount(() => {
		console.log($api_store);
	});

	const handle_submit_comment = async (event) => {
		const { content } = event.detail;
		if ($user_store.id) {
			const new_comment = await $api_store.post_comments.insert({
				post_id: post.id,
				user_id: $user_store.id,
				content,
			});

			new_comment.post_comment_votes = [];
			new_comment.upvotes = 0;
			new_comment.downvotes = 0;
			new_comment.user_vote = 0;
			new_comment.replies = [];

			comments = [...comments, new_comment];
		} else if (!$user_store.id) {
			alert('로그인이 필요합니다.');
		}
	};
</script>

<Header>
	<button slot="left" class="flex items-center" onclick={() => goto('/')}>
		<RiArrowLeftSLine size={28} color={colors.gray[600]} />
	</button>

	<h1 slot="center" class="text-medium">{TITLE}</h1>

	<button slot="right">
		<Icon attribute="menu" size={24} color={colors.gray[600]} />
	</button>
</Header>

<Post {post} />

<main class="space-y-4 p-4">
	{#each comments as comment (comment.id)}
		<Comment post_id={post.id} {comment} />
	{/each}
</main>

<CommentInput on:submit={handleSubmitComment} />
