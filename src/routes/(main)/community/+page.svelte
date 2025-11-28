<script>
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { RiAddLine } from 'svelte-remixicon';

	import Bottom_nav from '$lib/components/ui/Bottom_nav.svelte';
	import Header from '$lib/components/ui/Header.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';

	import logo from '$lib/img/logo.png';
	import colors from '$lib/config/colors';
	import { check_login, show_toast } from '$lib/utils/common';
	import { optimize_avatar } from '$lib/utils/image';
	import { get_user_context, get_api_context } from '$lib/contexts/app_context.svelte.js';

	const me = get_user_context();
	const api = get_api_context();

	let { data } = $props();

	let communities = $state(data.communities || []);
	let infinite_scroll_communities = $state([]);
	let all_communities = $derived([...communities, ...infinite_scroll_communities]);
	let is_infinite_loading = $state(false);
	let last_community_id = $state('');

	/**
	 * 커뮤니티 멤버십 상태 업데이트 (Optimistic UI)
	 * @param {string} community_id - 커뮤니티 ID
	 * @param {boolean} is_member - 멤버 여부
	 * @param {number} count_delta - 멤버 수 변경량 (+1 또는 -1)
	 */
	const update_community_membership = (community_id, is_member, count_delta) => {
		communities = communities.map((c) =>
			c.id === community_id
				? { ...c, is_member, member_count: Math.max(0, c.member_count + count_delta) }
				: c
		);
	};

	/**
	 * 커뮤니티 참여 처리
	 * @param {string} community_id - 커뮤니티 ID
	 */
	const handle_join = async (community_id) => {
		update_community_membership(community_id, true, 1);

		try {
			await api.community_members.insert(community_id, me.id);
			show_toast('success', '커뮤니티에 참여했어요!');
		} catch (error) {
			console.error('Failed to join community:', error);
			update_community_membership(community_id, false, -1);
			show_toast('error', '참여 중 오류가 발생했어요.');
		}
	};

	/**
	 * 커뮤니티 탈퇴 처리
	 * @param {string} community_id - 커뮤니티 ID
	 */
	const handle_leave = async (community_id) => {
		update_community_membership(community_id, false, -1);

		try {
			await api.community_members.delete(community_id, me.id);
			show_toast('error', '커뮤니티 참여가 취소되었어요!');
		} catch (error) {
			console.error('Failed to leave community:', error);
			update_community_membership(community_id, true, 1);
			show_toast('error', '참여 취소 중 오류가 발생했어요.');
		}
	};

	/**
	 * 무한 스크롤 데이터 로드
	 */
	const load_more_data = async () => {
		if (is_infinite_loading) return;

		is_infinite_loading = true;
		try {
			const new_communities = await api.communities.select_infinite_scroll(
				last_community_id,
				me?.id
			);

			if (new_communities.length > 0) {
				infinite_scroll_communities = [...infinite_scroll_communities, ...new_communities];
				last_community_id = new_communities[new_communities.length - 1]?.id || '';
			}
		} catch (error) {
			console.error('Failed to load more communities:', error);
		} finally {
			is_infinite_loading = false;
		}
	};

	/**
	 * 무한 스크롤 옵저버 설정
	 * @returns {() => void} cleanup 함수
	 */
	const setup_infinite_scroll = () => {
		const target = document.getElementById('infinite_scroll');
		if (!target) return () => {};

		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting && all_communities.length >= 10 && !is_infinite_loading) {
						load_more_data();
					}
				});
			},
			{ rootMargin: '100px' }
		);

		observer.observe(target);
		return () => observer.disconnect();
	};

	onMount(() => {
		last_community_id = all_communities[all_communities.length - 1]?.id || '';
		return setup_infinite_scroll();
	});
</script>

<svelte:head>
	<title>커뮤니티 | 문</title>
	<meta
		name="description"
		content="다양한 주제와 관심사를 가진 사람들이 모여 소통하고 정보를 나누는 공간입니다."
	/>
</svelte:head>

<Header>
	<h1 slot="left" class="font-semibold">커뮤니티</h1>
</Header>

<main>
	{#each all_communities as community (community.id)}
		<article class="px-4">
			<div class="flex items-start justify-between">
				<a href={`/community/${community.slug}`} class="flex">
					<img
						src={optimize_avatar(community.avatar_url) || logo}
						alt={`${community.title} 커뮤니티 아바타`}
						class="mr-2 block aspect-square h-10 w-10 rounded-full object-cover"
						loading="lazy"
						decoding="async"
						width="40"
						height="40"
					/>

					<div class="flex flex-col justify-between">
						<p class="line-clamp-2 pr-4 font-medium">
							{community.title}
						</p>
						<p class="flex text-xs text-gray-400">
							<Icon attribute="person" size={16} color={colors.gray[400]} />
							{community.member_count}
						</p>
					</div>
				</a>

				{#if community.is_member}
					<button
						onclick={() => handle_leave(community.id)}
						class="btn btn-sm btn-soft h-7"
						aria-label={`${community.title} 커뮤니티 탈퇴`}
					>
						참여중
					</button>
				{:else}
					<button
						onclick={() => {
							if (!check_login(me)) return;
							handle_join(community.id);
						}}
						class="btn btn-primary btn-sm h-7"
						aria-label={`${community.title} 커뮤니티 참여하기`}
					>
						참여하기
					</button>
				{/if}
			</div>

			<p class="mt-2 line-clamp-2 text-sm text-gray-800">
				{community.content}
			</p>
		</article>

		<hr class="my-3 border-gray-200" />
	{/each}

	<div id="infinite_scroll"></div>

	{#if is_infinite_loading}
		<div class="flex justify-center py-4">
			<div
				class="border-primary h-8 w-8 animate-spin rounded-full border-t-2 border-b-2"
				role="status"
				aria-label="커뮤니티 로딩 중"
			></div>
		</div>
	{/if}

	<div class="fixed bottom-18 mx-auto flex w-full max-w-screen-md justify-end pr-4">
		<button
			class="rounded-full bg-blue-500 p-4 text-white shadow-lg hover:bg-blue-600"
			onclick={() => {
				if (!check_login(me)) return;
				goto('/community/regi');
			}}
			aria-label="새 커뮤니티 만들기"
		>
			<RiAddLine size={20} color={colors.white} />
		</button>
	</div>
</main>

<Bottom_nav />
