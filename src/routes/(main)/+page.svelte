<script>
	import { goto } from '$app/navigation';
	import { onDestroy, onMount } from 'svelte';
	import { RiAddLine, RiNotificationFill } from 'svelte-remixicon';

	import Bottom_nav from '$lib/components/ui/Bottom_nav.svelte';
	import Header from '$lib/components/ui/Header.svelte';
	import TabSelector from '$lib/components/ui/TabSelector.svelte';
	import PostSkeleton from '$lib/components/ui/PostSkeleton.svelte';

	// Dynamic imports for code splitting
	let Post = $state();
	let Icon = $state();

	import colors from '$lib/config/colors';
	import { check_login } from '$lib/utils/common';
	import { get_user_context, get_api_context } from '$lib/contexts/app-context.svelte.js';
	import { update_global_store } from '$lib/store/global_store.js';
	import { createPostHandlers } from '$lib/composables/usePostHandlers.svelte.js';

	const { me } = get_user_context();
	const { api } = get_api_context();

	const TITLE = '문';

	let { data } = $props();
	// Handle streamed data - convert promises to reactive state
	let joined_communities = $state([]);
	let posts = $state([]);

	let tabs = $state(['최신']);
	let selected = $state(0);
	let unread_count = $state(0);

	let last_post_id = $state('');

	let is_infinite_loading = $state(false);
	let observer = $state(null);

	onMount(async () => {
		// Dynamic import components
		const [PostModule, IconModule] = await Promise.all([
			import('$lib/components/Post.svelte'),
			import('$lib/components/ui/Icon.svelte')
		]);
		Post = PostModule.default;
		Icon = IconModule.default;

		// Initialize data (no longer using streaming)
		posts = data.posts || [];
		last_post_id = posts[posts.length - 1]?.id || '';

		joined_communities = data.joined_communities || [];
		tabs = ['최신', ...joined_communities.map((c) => c.title)];

		infinite_scroll();

		// 초기 알림 미읽음 카운트 로드
		refresh_unread_count();
	});

	// 사용자 변경 시 미읽음 카운트 갱신
	$effect(() => {
		const uid = me.id;
		if (!uid) return;
		refresh_unread_count();
	});

	const refresh_unread_count = async () => {
		try {
			if (!me?.id) return;
			unread_count = await api.notifications.select_unread_count(
				me.id,
			);
		} catch (e) {
			console.error('Failed to load unread notifications count:', e);
		}
	};

	// Cache posts by community to avoid unnecessary API calls
	let posts_cache = $state(new Map());

	$effect(() => {
		// Track dependencies
		const current_selected = selected;
		const current_communities = joined_communities;

		// Use untrack to prevent infinite loops
		const community_id =
			current_selected === 0 ? '' : (current_communities[current_selected - 1]?.id ?? '');

		// Check cache first
		const cache_key = community_id || 'all';
		if (posts_cache.has(cache_key)) {
			const cached = posts_cache.get(cache_key);
			posts = cached.posts;
			last_post_id = cached.last_post_id;
			return;
		}

		// Load from API only if not cached
		api.posts.select_infinite_scroll('', community_id, 10).then((initial_posts) => {
			posts = initial_posts;
			last_post_id = initial_posts.at(-1)?.id ?? '';
			// Update cache
			posts_cache.set(cache_key, { posts: initial_posts, last_post_id: initial_posts.at(-1)?.id ?? '' });
		});
	});

	/**
	 * 무한스크롤 설정 함수
	 */
	const infinite_scroll = () => {
		// Clean up existing observer
		if (observer) {
			observer.disconnect();
		}

		const target = document.getElementById('infinite_scroll');
		if (!target) return;

		observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (
						entry.isIntersecting &&
						!is_infinite_loading &&
						posts.length >= 10
					) {
						is_infinite_loading = true;
						load_more_data().finally(() => {
							is_infinite_loading = false;
						});
					}
				});
			},
			{
				rootMargin: '200px 0px',
				threshold: 0.01,
			},
		);

		observer.observe(target);
	};

	// Cleanup observer on component destroy
	onDestroy(() => {
		if (observer) {
			observer.disconnect();
		}
	});

	/**
	 * 무한스크롤 데이터 더 가져오기
	 */
	const load_more_data = async () => {
		const community_id =
			selected === 0 ? '' : joined_communities[selected - 1].id;
		const available_post = await api.posts.select_infinite_scroll(
			last_post_id,
			community_id,
			10,
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
		await api.post_comments.insert({
			post_id,
			user_id: me.id,
			content: gift_content,
			parent_comment_id,
			gift_moon_point,
		});

		console.log('Gift comment added successfully');
	};

	// Post 이벤트 핸들러 (composable 사용)
	const { handle_bookmark_changed, handle_vote_changed } = createPostHandlers(
		() => posts,
		(updated_posts) => {
			posts = updated_posts;
			// 캐시도 함께 업데이트
			const cache_key = selected === 0 ? 'all' : (joined_communities[selected - 1]?.id || '');
			if (posts_cache.has(cache_key)) {
				posts_cache.set(cache_key, { posts: updated_posts, last_post_id });
			}
		},
		me
	);
</script>

<svelte:head>
	<title>전문가 매칭의 모든것, 문</title>
	<meta
		name="description"
		content="AI·마케팅·디자인·IT 등 다양한 분야의 전문가를 문에서 만나보세요."
	/>
</svelte:head>

<Header>
	<h1 slot="left" class="font-semibold">{TITLE}</h1>

	<button onclick={() => goto('/alarm')} slot="right" class="relative">
		<RiNotificationFill size={20} color={colors.gray[400]} />
		{#if unread_count > 0}
			<span
				class="absolute -top-1 -right-1 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] leading-none text-white"
			>
				{unread_count > 99 ? '99+' : unread_count}
			</span>
		{/if}
	</button>
</Header>
<main>
	<TabSelector {tabs} bind:selected />

	{#if posts.length === 0}
		<!-- Loading skeleton -->
		{#each Array(5) as _, i}
			<div class="mt-4">
				<PostSkeleton />
			</div>
		{/each}
	{:else}
		{#each posts as post}
			<div class="mt-4">
				<Post
				{post}
				onGiftCommentAdded={handle_gift_comment_added}
				onBookmarkChanged={handle_bookmark_changed}
				onVoteChanged={handle_vote_changed}
			/>
			</div>
		{/each}
	{/if}

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
			class="rounded-full bg-blue-500 p-4 text-white shadow-lg hover:bg-blue-600"
			onclick={() => {
				if (!check_login(me)) return;

				goto('/regi/post');
			}}
		>
			<RiAddLine size={20} color={colors.white} />
		</button>
	</div>
</main>

<Bottom_nav />
