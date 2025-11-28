<script>
	import { create_post_handlers } from '$lib/composables/use_post_handlers.svelte.js';
	import colors from '$lib/config/colors';
	import {
		get_api_context,
		get_user_context,
	} from '$lib/contexts/app_context.svelte.js';
	import { smart_go_back } from '$lib/utils/navigation.js';
	import { goto } from '$app/navigation';

	import Bottom_nav from '$lib/components/ui/Bottom_nav.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import TabSelector from '$lib/components/ui/TabSelector.svelte';
	import Community from '$lib/components/Community.svelte';
	import Post from '$lib/components/Post.svelte';
	import UserCard from '$lib/components/Profile/UserCard.svelte';
	import Service from '$lib/components/Service.svelte';

	const me = get_user_context();
	const api = get_api_context();

	let search_text = $state('');
	let search_data = $state({
		posts: [],
		communities: [],
		community_members: [],
		services: [],
		service_likes: [],
		profiles: [],
	});

	let tabs = ['게시글', '커뮤니티', '서비스', '프로필'];
	let selected = $state(0);

	/**
	 * 게시물에 사용자 상호작용 데이터 추가
	 * @param {Array} post_list - 게시물 배열
	 * @returns {Promise<Array>} votes/bookmarks가 포함된 게시물 배열
	 */
	const attach_user_interactions = async (post_list) => {
		if (!me?.id || post_list.length === 0) {
			return post_list;
		}

		try {
			const [all_votes, all_bookmarks] = await Promise.all([
				api.post_votes.select_by_user_id(me.id),
				api.post_bookmarks.select_by_user_id_lightweight(me.id),
			]);

			const post_ids = new Set(post_list.map((p) => p.id));
			const votes = all_votes.filter((v) => post_ids.has(v.post_id));
			const bookmarks = all_bookmarks.filter((b) => post_ids.has(b.post_id));

			return post_list.map((post) => ({
				...post,
				post_votes: votes.filter((v) => v.post_id === post.id),
				post_bookmarks: bookmarks.filter((b) => b.post_id === post.id),
			}));
		} catch (error) {
			console.error('Failed to attach user interactions:', error);
			return post_list;
		}
	};

	const handle_search = async () => {
		if (search_text === '') return;

		if (selected === 0) {
			const posts = await api.posts.select_by_search(search_text);
			search_data.posts = await attach_user_interactions(posts);
		} else if (selected === 1) {
			search_data.communities =
				await api.communities.select_by_search(search_text);
			search_data.community_members =
				await api.community_members.select_by_user_id(me.id);
		} else if (selected === 2) {
			search_data.services = await api.services.select_by_search(search_text);
			search_data.service_likes = await api.service_likes.select_by_user_id(
				me.id,
			);
		} else if (selected === 3) {
			search_data.profiles = await api.users.select_by_search(search_text);
		}
	};

	const handle_gift_comment_added = async ({
		gift_content,
		gift_amount,
		parent_comment_id,
		post_id,
	}) => {
		// 실제 댓글 추가 (메인 페이지에서는 UI에 표시되지 않지만 DB에는 저장됨)
		await api.post_comments.insert({
			post_id,
			user_id: me.id,
			content: gift_content,
			parent_comment_id,
			gift_amount,
		});
	};

	// Post 이벤트 핸들러 (composable 사용)
	const { handle_bookmark_changed, handle_vote_changed } = create_post_handlers(
		() => search_data.posts,
		(updated_posts) => {
			search_data.posts = updated_posts;
		},
		me,
	);

	/**
	 * 서비스 좋아요 상태 변경 핸들러
	 * @param {Object} event - 좋아요 변경 이벤트
	 * @param {string} event.service_id - 서비스 ID
	 * @param {Array} event.likes - 업데이트된 좋아요 배열
	 */
	const handle_service_like_changed = ({ service_id, likes }) => {
		search_data.service_likes = likes;
	};
</script>

<svelte:head>
	<title>검색 | 문</title>
	<meta
		name="description"
		content="게시글, 커뮤니티, 서비스, 프로필을 검색하여 원하는 정보와 전문가를 찾아보세요."
	/>
</svelte:head>

<header class="sticky top-0 z-50 bg-white whitespace-nowrap">
	<nav class="pt-safe">
		<div class="z-10 flex h-[56px] w-full items-center gap-2 px-2">
			<button onclick={smart_go_back}>
				<Icon attribute="arrow_left" size={28} color={colors.gray[600]} />
			</button>

			<div class="relative w-full">
				<input
					type="text"
					placeholder="검색어를 입력하세요"
					class="block w-full rounded-lg bg-gray-100 p-2.5 text-sm focus:outline-none"
					bind:value={search_text}
					onkeydown={async (e) => {
						if (e.key === 'Enter') {
							await handle_search();
						}
					}}
				/>
				<button
					onclick={async () => {
						await handle_search();
					}}
					class="absolute inset-y-0 right-1 flex items-center pr-3"
				>
					<Icon attribute="search" size={24} color={colors.gray[500]} />
				</button>
			</div>
		</div>
	</nav>
</header>

<main>
	<div class="mt-4">
		<TabSelector {tabs} bind:selected on_change={handle_search} />
	</div>
	{#if selected === 0 && search_data.posts.length > 0}
		{#each search_data.posts as post}
			<div class="mt-4">
				<Post
					{post}
					onGiftCommentAdded={handle_gift_comment_added}
					onBookmarkChanged={handle_bookmark_changed}
					onVoteChanged={handle_vote_changed}
				/>
			</div>
		{/each}
	{:else if selected === 1 && search_data.communities.length > 0}
		{#each search_data.communities as community}
			<div class="mt-4">
				<Community
					{community}
					community_members={search_data.community_members}
				/>
			</div>
		{/each}
	{:else if selected === 2 && search_data.services.length > 0}
		<div class="mt-4 grid grid-cols-2 gap-4 px-4">
			{#each search_data.services as service}
				<Service {service} service_likes={search_data.service_likes} onLikeChanged={handle_service_like_changed} />
			{/each}
		</div>
	{:else if selected === 3 && search_data.profiles.length > 0}
		<div class="mt-4">
			{#each search_data.profiles as profile}
				<UserCard {profile} />
			{/each}
		</div>
	{:else}
		<div class="mt-12 flex h-full items-center justify-center">
			<p class="text-gray-400">검색 결과가 없습니다.</p>
		</div>
	{/if}
</main>
