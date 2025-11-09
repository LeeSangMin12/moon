<script>
	import { onDestroy, onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import {
		RiAddLine,
		RiNotificationFill,
		RiSearchLine,
	} from 'svelte-remixicon';

	import {
		get_api_context,
		get_user_context,
	} from '$lib/contexts/app_context.svelte.js';
	import { createHomeData } from '$lib/composables/useHomeData.svelte.js';
	import { createPostHandlers } from '$lib/composables/usePostHandlers.svelte.js';
	import { check_login } from '$lib/utils/common';
	import colors from '$lib/config/colors';

	import Bottom_nav from '$lib/components/ui/Bottom_nav.svelte';
	import Header from '$lib/components/ui/Header.svelte';
	import PostSkeleton from '$lib/components/ui/PostSkeleton.svelte';
	import TabSelector from '$lib/components/ui/TabSelector.svelte';

	// ===== Constants =====
	const TITLE = '문';

	// ===== Context =====
	const me = get_user_context();
	const api = get_api_context();

	// ===== Props =====
	let { data } = $props();

	// ===== Dynamic Imports (Code Splitting) =====
	/** @type {any} Post 컴포넌트 (동적 로드) */
	let Post = $state();

	// ===== Home Data (Composable) =====
	const home_data = createHomeData(api, me, data.posts || []);

	// ===== Lifecycle =====
	onMount(async () => {
		// 1. 동적으로 Post 컴포넌트 import (코드 스플리팅)
		const PostModule = await import('$lib/components/Post.svelte');
		Post = PostModule.default;

		// 2. 초기 게시물 설정
		home_data.initialize_posts();

		// 3. 보조 데이터 로딩 (백그라운드)
		home_data.load_secondary_data();
	});

	onDestroy(() => {
		// 무한스크롤 observer cleanup은 $effect에서 처리
	});

	// ===== Effects =====
	/**
	 * 무한스크롤 설정
	 * 컴포넌트 마운트 후 observer 설정
	 */
	$effect(() => {
		// DOM이 준비된 후에만 실행
		if (!Post) return;

		const cleanup = home_data.setup_infinite_scroll();
		return cleanup;
	});

	/**
	 * 사용자 로그인 시 알림 카운트 갱신
	 */
	$effect(() => {
		const user_id = me.id;
		if (!user_id) return;

		home_data.refresh_unread_count();
	});

	/**
	 * 탭 변경 시 게시물 로드
	 */
	$effect(() => {
		const current_selected = home_data.selected;
		const communities = home_data.joined_communities;

		// 커뮤니티 데이터가 로드된 후에만 실행
		if (current_selected > 0 && communities.length === 0) return;

		home_data.load_posts_by_tab(current_selected);
	});

	// ===== Event Handlers =====
	/**
	 * Gift 댓글 추가 핸들러
	 * 메인 페이지에서는 UI에 표시되지 않지만 DB에는 저장됩니다.
	 *
	 * @param {Object} params - Gift 댓글 파라미터
	 * @param {string} params.gift_content - Gift 메시지 내용
	 * @param {number} params.gift_moon_point - Gift 포인트
	 * @param {string|null} params.parent_comment_id - 부모 댓글 ID
	 * @param {string} params.post_id - 게시물 ID
	 */
	const handle_gift_comment_added = async ({
		gift_content,
		gift_moon_point,
		parent_comment_id,
		post_id,
	}) => {
		try {
			await api.post_comments.insert({
				post_id,
				user_id: me.id,
				content: gift_content,
				parent_comment_id,
				gift_moon_point,
			});
			console.log('Gift comment added successfully');
		} catch (error) {
			console.error('Failed to add gift comment:', error);
		}
	};

	/**
	 * 게시물 작성 버튼 클릭 핸들러
	 * 로그인 확인 후 작성 페이지로 이동
	 */
	const handle_create_post = () => {
		if (!check_login(me)) return;
		goto('/regi/post');
	};

	/**
	 * 검색 버튼 클릭 핸들러
	 */
	const handle_search = () => {
		goto('/search');
	};

	/**
	 * 알림 버튼 클릭 핸들러
	 */
	const handle_alarm = () => {
		goto('/alarm');
	};

	// ===== Post Interaction Handlers (Composable) =====
	const { handle_bookmark_changed, handle_vote_changed } = createPostHandlers(
		() => home_data.posts,
		(updated_posts) => home_data.update_posts(updated_posts),
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

	<div slot="right" class="flex items-center gap-4">
		<!-- 검색 버튼 -->
		<button onclick={handle_search} aria-label="검색">
			<RiSearchLine size={20} color={colors.gray[400]} />
		</button>

		<!-- 알림 버튼 -->
		<button onclick={handle_alarm} class="relative" aria-label="알림">
			<RiNotificationFill size={20} color={colors.gray[400]} />
			{#if home_data.unread_count > 0}
				<span
					class="absolute -top-1 -right-1 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] leading-none text-white"
				>
					{home_data.unread_count > 99 ? '99+' : home_data.unread_count}
				</span>
			{/if}
		</button>
	</div>
</Header>

<main>
	<!-- 탭 선택기 -->
	<TabSelector tabs={home_data.tabs} bind:selected={home_data.selected} />

	<!-- 게시물 목록 -->
	{#if home_data.posts.length === 0}
		<!-- 로딩 스켈레톤 -->
		{#each Array(5) as _, i (i)}
			<div class="mt-4">
				<PostSkeleton />
			</div>
		{/each}
	{:else}
		<!-- 게시물 목록 -->
		{#each home_data.posts as post (post.id)}
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

	<!-- 무한스크롤 트리거 -->
	<div id="infinite_scroll"></div>

	<!-- 로딩 스피너 -->
	<div class="flex justify-center py-4">
		<div
			class={`border-primary h-8 w-8 animate-spin rounded-full border-t-2 border-b-2 ${
				home_data.is_infinite_loading ? '' : 'hidden'
			}`}
		></div>
	</div>

	<!-- 게시물 작성 플로팅 버튼 -->
	<div
		class="fixed bottom-18 z-10 mx-auto flex w-full max-w-screen-md justify-end pr-4"
	>
		<button
			class="rounded-full bg-blue-500 p-4 text-white shadow-lg hover:bg-blue-600"
			onclick={handle_create_post}
			aria-label="게시물 작성"
		>
			<RiAddLine size={20} color={colors.white} />
		</button>
	</div>
</main>

<Bottom_nav />
