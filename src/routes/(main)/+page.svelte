<script>
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { RiAddLine } from 'svelte-remixicon';

	import Bottom_nav from '$lib/components/ui/Bottom_nav/+page.svelte';
	import Header from '$lib/components/ui/Header/+page.svelte';
	import Icon from '$lib/components/ui/Icon/+page.svelte';
	import TabSelector from '$lib/components/ui/TabSelector/+page.svelte';
	import Post from '$lib/components/Post/+page.svelte';

	import colors from '$lib/js/colors';
	import { check_login } from '$lib/js/common';
	import { api_store } from '$lib/store/api_store';
	import { update_global_store } from '$lib/store/global_store.js';
	import { user_store } from '$lib/store/user_store';

	const TITLE = '문';

	let { data } = $props();
	let { joined_communities = [], posts = [] } = $state(data);

	let tabs = $state(['최신']);
	let selected = $state(0);

	let is_infinite_loading = $state(false);
	let last_post_id = $state('');

	onMount(async () => {
		if (joined_communities) {
			tabs = ['최신', ...joined_communities.map((c) => c.title)];
		}

		last_post_id = posts[posts.length - 1]?.id || '';
		infinite_scroll();
	});

	$effect(async () => {
		if (selected === 0) {
			posts = await $api_store.posts.select_infinite_scroll('', '');
		} else {
			const community_id = joined_communities[selected - 1].id;
			posts = await $api_store.posts.select_infinite_scroll('', community_id);
		}
		last_post_id = posts.at(-1)?.id ?? '';
	});

	/**
	 * 무한스크롤 함수
	 */
	const infinite_scroll = () => {
		const observer = new IntersectionObserver((entries) => {
			entries.forEach((entry) => {
				if (posts.length >= 10 && entry.isIntersecting) {
					is_infinite_loading = true;
					setTimeout(() => {
						load_more_data();
					}, 1500);
				}
			});
		});

		const target = document.getElementById('infinite_scroll');
		observer.observe(target);
	};

	/**
	 * 무한스크롤 데이터 더 가져오기
	 */
	const load_more_data = async () => {
		const community_id =
			selected === 0 ? '' : joined_communities[selected - 1].id;
		const available_post = await $api_store.posts.select_infinite_scroll(
			last_post_id,
			community_id,
		);
		is_infinite_loading = false;

		//더 불러올 값이 있을때만 조회
		if (available_post.length !== 0) {
			posts = [...posts, ...available_post];

			last_post_id = available_post.at(-1)?.id ?? '';
		}
	};

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

		console.log('Gift comment added successfully');
	};
</script>

<svelte:head>
	<title>맞춤형 AI 전문가 매칭, 문</title>
	<meta
		name="description"
		content="AI·마케팅·디자인·IT 등 다양한 분야의 전문가를 문에서 만나보세요. 전문가 매칭 서비스로 원하는 서비스를 찾아보세요."
	/>
</svelte:head>

<Header>
	<h1 slot="left" class="font-semibold">{TITLE}</h1>

	<!-- <button onclick={() => goto('/search')} slot="right">
		<Icon attribute="search" size={24} color={colors.gray[600]} />
	</button> -->
</Header>

<main>
	<TabSelector {tabs} bind:selected />

	{#each posts as post}
		<div class="mt-4">
			<Post {post} on:gift_comment_added={handle_gift_comment_added} />
		</div>
	{/each}

	<div id="infinite_scroll"></div>

	<div class="flex justify-center py-4">
		<div
			class={`border-primary h-8 w-8 animate-spin rounded-full border-t-2 border-b-2 ${
				is_infinite_loading === false ? 'hidden' : ''
			}`}
		></div>
	</div>

	<!-- floating right button -->
	<div
		class="fixed bottom-18 z-10 mx-auto flex w-full max-w-screen-md justify-end pr-4"
	>
		<button
			class="rounded-full bg-blue-500 p-3 text-white shadow-lg hover:bg-blue-600"
			onclick={() => {
				if (!check_login()) return;

				goto('/regi/post');
			}}
		>
			<RiAddLine size={20} color={colors.white} />
		</button>
	</div>
</main>

<Bottom_nav />
