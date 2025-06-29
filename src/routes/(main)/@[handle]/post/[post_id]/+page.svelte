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

	onMount(() => {
		console.log('comments', comments);
	});

	let { data } = $props();
	let { post, comments } = $state(data);

	const leave_post_comment = async (event) => {
		const { content } = event.detail;
		const new_comment = await $api_store.post_comments.insert({
			post_id: post.id,
			user_id: $user_store.id,
			content: content.trim(),
		});

		new_comment.post_comment_votes = [];
		new_comment.upvotes = 0;
		new_comment.downvotes = 0;
		new_comment.user_vote = 0;
		new_comment.replies = [];
		new_comment.users = {
			id: $user_store.id,
			handle: $user_store.handle,
			avatar_url: $user_store.avatar_url,
		};

		comments = [...comments, new_comment];
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

<main>
	<div class="space-y-4 p-4">
		{#each comments as comment, i (comment.id)}
			<Comment post_id={post.id} bind:comment={comments[i]} />
		{/each}
	</div>
</main>

<CommentInput on:leave_comment={leave_post_comment} />
