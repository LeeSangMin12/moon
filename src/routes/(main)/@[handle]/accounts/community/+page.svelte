<script>
	import logo from '$lib/img/logo.png';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { RiAddLine, RiArrowLeftSLine } from 'svelte-remixicon';

	import Bottom_nav from '$lib/components/ui/Bottom_nav/+page.svelte';
	import Header from '$lib/components/ui/Header/+page.svelte';
	import Icon from '$lib/components/ui/Icon/+page.svelte';

	import colors from '$lib/js/colors';
	import { check_login, show_toast } from '$lib/js/common';
	import { get_user_context, get_api_context } from '$lib/contexts/app-context.svelte.js';

	const { me } = get_user_context();
	const { api } = get_api_context();

	let { data } = $props();
	let { joined_communities, community_members } = $state(data);

	const is_user_member = (community) => {
		return community_members.some(
			(member) => member.community_id === community.id,
		);
	};

	const community_members_count = (community) => {
		return community.community_members?.[0]?.count ?? 0;
	};

	const handle_join = async (community_id) => {
		try {
			await api.community_members.insert(community_id, me.id);
			community_members.push({ community_id, user_id: me.id });
			show_toast('success', '커뮤니티에 참여했어요!');
		} catch (error) {
			console.error(error);
		}
	};

	const handle_leave = async (community_id) => {
		try {
			await api.community_members.delete(community_id, me.id);
			community_members = community_members.filter(
				(member) => member.community_id !== community_id,
			);
			show_toast('error', '커뮤니티 참여가 취소되었어요!');
		} catch (error) {
			console.error(error);
		}
	};
</script>

<svelte:head>
	<title>참여 커뮤니티 | 문</title>
	<meta
		name="description"
		content="내가 참여한 커뮤니티 목록을 한눈에 확인하고, 커뮤니티 활동을 쉽게 관리"
	/>
</svelte:head>

<Header>
	<div slot="left">
		<button onclick={() => goto(`/@${me.handle}/accounts`)}>
			<RiArrowLeftSLine size={24} color={colors.gray[800]} />
		</button>
	</div>
	<h1 slot="center" class="font-semibold">참여 커뮤니티</h1>
</Header>

<main>
	{#each joined_communities as item}
		{#if item.communities}
			<article class="px-4">
				<div class="flex items-start justify-between">
					<a href={`/community/${item.communities.slug}`} class="flex">
						<img
							src={item.communities.avatar_url || logo}
							alt="커뮤니티 아바타"
							class="mr-2 h-12 w-12 rounded-full object-cover"
						/>
						<div class="flex flex-col justify-between">
							<p class="line-clamp-2 pr-4 font-medium">
								{item.communities.title}
							</p>
							<p class="flex text-xs text-gray-400">
								<Icon attribute="person" size={16} color={colors.gray[400]} />
								{community_members_count(item.communities)}
							</p>
						</div>
					</a>

					{#if is_user_member(item.communities)}
						<button
							onclick={() => handle_leave(item.communities.id)}
							class="btn btn-sm btn-soft h-7"
						>
							참여중
						</button>
					{:else}
						<button
							onclick={() => {
								if (!check_login()) return;

								handle_join(item.communities.id);
							}}
							class="btn btn-primary btn-sm h-7"
						>
							참여하기
						</button>
					{/if}
				</div>

				<p class="mt-2 line-clamp-2 text-sm text-gray-800">
					{item.communities.content}
				</p>
			</article>

			<hr class="my-3 border-gray-200" />
		{/if}
	{/each}

	<div
		class="fixed bottom-18 mx-auto flex w-full max-w-screen-md justify-end pr-4"
	>
		<button
			class="rounded-full bg-blue-500 p-3 text-white shadow-lg hover:bg-blue-600"
			onclick={() => {
				if (!check_login()) return;

				goto('/community/regi');
			}}
		>
			<RiAddLine size={20} color={colors.white} />
		</button>
	</div>
</main>
