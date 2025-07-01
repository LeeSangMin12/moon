<script>
	import { goto } from '$app/navigation';

	import Bottom_nav from '$lib/components/ui/Bottom_nav/+page.svelte';
	import Icon from '$lib/components/ui/Icon/+page.svelte';
	import TabSelector from '$lib/components/ui/TabSelector/+page.svelte';
	import Community from '$lib/components/Community/+page.svelte';
	import Post from '$lib/components/Post/+page.svelte';
	import UserCard from '$lib/components/Profile/UserCard.svelte';
	import Service from '$lib/components/Service/+page.svelte';

	import colors from '$lib/js/colors';
	import { api_store } from '$lib/store/api_store';
	import { user_store } from '$lib/store/user_store';

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

	const handle_search = async () => {
		if (search_text === '') return;

		if (selected === 0) {
			search_data.posts = await $api_store.posts.select_by_search(search_text);
		} else if (selected === 1) {
			search_data.communities =
				await $api_store.communities.select_by_search(search_text);
			search_data.community_members =
				await $api_store.community_members.select_by_user_id($user_store.id);
		} else if (selected === 2) {
			search_data.services =
				await $api_store.services.select_by_search(search_text);
			search_data.service_likes =
				await $api_store.service_likes.select_by_user_id($user_store.id);
		} else if (selected === 3) {
			search_data.profiles =
				await $api_store.users.select_by_search(search_text);
		}
	};
</script>

<header class="sticky top-0 z-50 bg-white whitespace-nowrap">
	<nav class="pt-safe">
		<div class="z-10 flex h-[56px] w-full items-center">
			<!-- <button onclick={() => goto('/')}>
				<Icon attribute="arrow_left" size={28} color={colors.gray[600]} />
			</button> -->

			<div class="relative w-full px-2">
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
				<Post {post} />
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
				<Service {service} service_likes={search_data.service_likes} />
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

<Bottom_nav />
