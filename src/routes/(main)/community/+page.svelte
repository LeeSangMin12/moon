<script>
	import logo from '$lib/img/logo.png';
	import { goto, invalidate } from '$app/navigation';
	import { onMount } from 'svelte';
	import { RiAddLine } from 'svelte-remixicon';

	import Bottom_nav from '$lib/components/ui/Bottom_nav/+page.svelte';
	import Header from '$lib/components/ui/Header/+page.svelte';
	import Icon from '$lib/components/ui/Icon/+page.svelte';

	import colors from '$lib/js/colors';
	import { check_login, show_toast } from '$lib/js/common';
	import { api_store } from '$lib/store/api_store';
	import { update_global_store } from '$lib/store/global_store.js';
	import { user_store } from '$lib/store/user_store';

	let { data } = $props();

	// 초기 서버 데이터를 state로 복사 (로컬 관리)
	let communities = $state(data.communities || []);

	// 무한 스크롤로 추가된 커뮤니티들
	let infinite_scroll_communities = $state([]);

	// 전체 커뮤니티 = 서버 데이터 + 무한스크롤 데이터
	let all_communities = $derived([...communities, ...infinite_scroll_communities]);

	let is_infinite_loading = $state(false);
	let last_community_id = $state('');

	onMount(() => {
		last_community_id =
			all_communities[all_communities.length - 1]?.id || '';
		infinite_scroll();
	});

	/**
	 * 무한스크롤 함수
	 */
	const infinite_scroll = () => {
		const observer = new IntersectionObserver((entries) => {
			entries.forEach((entry) => {
				if (all_communities.length >= 10 && entry.isIntersecting) {
					is_infinite_loading = true;
					setTimeout(() => {
						load_more_data();
					}, 1000);
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
		const available_community =
			await $api_store.communities.select_infinite_scroll(last_community_id, $user_store?.id);
		is_infinite_loading = false;

		//더 불러올 값이 있을때만 조회
		if (available_community.length !== 0) {
			infinite_scroll_communities = [...infinite_scroll_communities, ...available_community];

			last_community_id =
				available_community[available_community.length - 1]?.id || '';
		}
	};

	const handle_join = async (community_id) => {
		try {
			// Optimistic update - UI 즉시 업데이트
			communities = communities.map(c =>
				c.id === community_id
					? { ...c, is_member: true, member_count: c.member_count + 1 }
					: c
			);

			await $api_store.community_members.insert(community_id, $user_store.id);
			show_toast('success', '커뮤니티에 참여했어요!');
		} catch (error) {
			console.error(error);
			// 실패 시 롤백
			communities = communities.map(c =>
				c.id === community_id
					? { ...c, is_member: false, member_count: Math.max(0, c.member_count - 1) }
					: c
			);
			show_toast('error', '참여 중 오류가 발생했어요.');
		}
	};

	const handle_leave = async (community_id) => {
		try {
			// Optimistic update - UI 즉시 업데이트
			communities = communities.map(c =>
				c.id === community_id
					? { ...c, is_member: false, member_count: Math.max(0, c.member_count - 1) }
					: c
			);

			await $api_store.community_members.delete(community_id, $user_store.id);
			show_toast('error', '커뮤니티 참여가 취소되었어요!');
		} catch (error) {
			console.error(error);
			// 실패 시 롤백
			communities = communities.map(c =>
				c.id === community_id
					? { ...c, is_member: true, member_count: c.member_count + 1 }
					: c
			);
			show_toast('error', '참여 취소 중 오류가 발생했어요.');
		}
	};
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
	<!-- <div slot="right" class="flex items-center gap-3">
		<button onclick={() => goto('/search')}>
			<Icon attribute="search" size={24} color={colors.gray[800]} />
		</button>
	</div> -->
</Header>

<main>
	{#each all_communities as community}
		<article class="px-4">
			<div class="flex items-start justify-between">
				<a href={`/community/${community.slug}`} class="flex">
					<img
						src={community.avatar_url || logo}
						alt="커뮤니티 아바타"
						class="mr-2 block aspect-square h-10 w-10 rounded-full object-cover"
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
					>
						참여중
					</button>
				{:else}
					<button
						onclick={() => {
							if (!check_login()) return;

							handle_join(community.id);
						}}
						class="btn btn-primary btn-sm h-7"
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

	<div class="flex justify-center py-4">
		<div
			class={`border-primary h-8 w-8 animate-spin rounded-full border-t-2 border-b-2 ${
				is_infinite_loading === false ? 'hidden' : ''
			}`}
		></div>
	</div>

	<div
		class="fixed bottom-18 mx-auto flex w-full max-w-screen-md justify-end pr-4"
	>
		<button
			class="rounded-full bg-blue-500 p-4 text-white shadow-lg hover:bg-blue-600"
			onclick={() => {
				if (!check_login()) return;

				goto('/community/regi');
			}}
		>
			<RiAddLine size={20} color={colors.white} />
		</button>
	</div>
</main>

<Bottom_nav />
