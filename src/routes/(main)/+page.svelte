<script>
	import { create_home_data } from '$lib/composables/use_home_data.svelte.js';
	import { create_post_handlers } from '$lib/composables/use_post_handlers.svelte.js';
	import colors from '$lib/config/colors';
	import {
		get_api_context,
		get_user_context,
	} from '$lib/contexts/app_context.svelte.js';
	import { check_login } from '$lib/utils/common';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import {
		RiAddLine,
		RiNotificationFill,
		RiSearchLine,
	} from 'svelte-remixicon';

	import Bottom_nav from '$lib/components/ui/Bottom_nav.svelte';
	import Header from '$lib/components/ui/Header.svelte';
	import Post from '$lib/components/Post.svelte';
	import PostSkeleton from '$lib/components/ui/PostSkeleton.svelte';
	import TabSelector from '$lib/components/ui/TabSelector.svelte';

	// ===== Constants =====
	const TITLE = '문';
	const SKELETON_COUNT = 5;
	const MAX_NOTIFICATION_BADGE = 99;

	// ===== Context =====
	const me = get_user_context();
	const api = get_api_context();

	// ===== Props =====
	let { data } = $props();

	// ===== Home Data (Composable) =====
	const home_data = create_home_data(api, me, data.posts || []);

	// ===== Lifecycle =====
	onMount(async () => {
		// 가입 완료 파라미터 제거 (GTM 전환 추적 후 URL 정리)
		if (window.location.search.includes('signup=complete')) {
			history.replaceState({}, '', '/');
		}

		home_data.initialize_posts();

		// 서버에서 스트리밍된 데이터 처리
		if (data.communities instanceof Promise) {
			data.communities.then((communities) => {
				home_data.joined_communities = communities;
				home_data.tabs = ['최신', ...communities.map((c) => c.title)];
			});
		} else if (data.communities) {
			home_data.joined_communities = data.communities;
			home_data.tabs = ['최신', ...data.communities.map((c) => c.title)];
		}

		if (data.unread_count instanceof Promise) {
			data.unread_count.then((count) => {
				home_data.unread_count = count;
			});
		} else if (data.unread_count !== undefined) {
			home_data.unread_count = data.unread_count;
		}
	});

	/**
	 * 무한스크롤 설정 (마운트 시 한 번만 실행)
	 */
	onMount(() => {
		return home_data.setup_infinite_scroll();
	});

	// ===== Event Handlers =====
	/**
	 * 탭 변경 핸들러
	 * @param {number} tab_index - 선택된 탭 인덱스
	 */
	const handle_tab_change = (tab_index) => {
		if (tab_index > 0 && home_data.joined_communities.length === 0) return;
		home_data.load_posts_by_tab(tab_index);
	};

	/**
	 * Gift 댓글 추가 핸들러
	 * 메인 페이지에서는 댓글 UI가 없지만 DB에는 저장됩니다.
	 *
	 * @param {Object} params - Gift 댓글 파라미터
	 * @param {string} params.gift_content - Gift 메시지 내용
	 * @param {number} params.gift_amount - Gift 포인트
	 * @param {string|null} params.parent_comment_id - 부모 댓글 ID
	 * @param {string} params.post_id - 게시물 ID
	 * @returns {Promise<void>}
	 */
	const handle_gift_comment_added = async ({
		gift_content,
		gift_amount,
		parent_comment_id,
		post_id,
	}) => {
		try {
			await api.post_comments.insert({
				post_id,
				user_id: me.id,
				content: gift_content,
				parent_comment_id,
				gift_amount,
			});
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
	const { handle_bookmark_changed, handle_vote_changed } = create_post_handlers(
		() => home_data.posts,
		(updated_posts) => home_data.update_posts(updated_posts),
		me,
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

		<button onclick={handle_alarm} class="relative" aria-label="알림">
			<RiNotificationFill size={20} color={colors.gray[400]} />
			{#if home_data.unread_count > 0}
				<span
					class="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] leading-none text-white"
					aria-label={`읽지 않은 알림 ${home_data.unread_count}개`}
				>
					{home_data.unread_count > MAX_NOTIFICATION_BADGE
						? `${MAX_NOTIFICATION_BADGE}+`
						: home_data.unread_count}
				</span>
			{/if}
		</button>
	</div>
</Header>

<main>
	<TabSelector
		tabs={home_data.tabs}
		bind:selected={home_data.selected}
		on_change={handle_tab_change}
	/>

	{#if home_data.is_tab_loading || home_data.posts.length === 0}
		{#each Array(SKELETON_COUNT) as _, i (i)}
			<div class="mt-4">
				<PostSkeleton />
			</div>
		{/each}
	{:else}
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

	<div id="infinite_scroll" aria-hidden="true"></div>

	{#if home_data.is_infinite_loading}
		<div class="flex justify-center py-4" role="status" aria-label="로딩 중">
			<div
				class="border-primary h-8 w-8 animate-spin rounded-full border-t-2 border-b-2"
			></div>
		</div>
	{/if}

	<div
		class="fixed bottom-18 z-10 mx-auto flex w-full max-w-screen-md justify-end pr-4"
	>
		<button
			class="rounded-full bg-blue-500 p-4 text-white shadow-lg hover:bg-blue-600 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none"
			onclick={handle_create_post}
			aria-label="게시물 작성"
		>
			<RiAddLine size={20} color={colors.white} />
		</button>
	</div>
</main>

<Bottom_nav />
