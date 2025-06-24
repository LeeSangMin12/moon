<script>
	import { afterNavigate, goto } from '$app/navigation';

	import Bottom_nav from '$lib/components/ui/Bottom_nav/+page.svelte';
	import Header from '$lib/components/ui/Header/+page.svelte';
	import Icon from '$lib/components/ui/Icon/+page.svelte';
	import TabSelector from '$lib/components/ui/TabSelector/+page.svelte';

	import colors from '$lib/js/colors';

	const TITLE = '검색';

	export let value = '';
	export let placeholder = '검색어를 입력하세요';
	export let onInput = () => {};

	let tabs = ['게시글', '커뮤니티', '서비스', '프로필'];
	let selected = 0;
</script>

<header class="sticky top-0 z-50 bg-white whitespace-nowrap">
	<nav class="pt-safe">
		<div class="z-10 flex h-[56px] w-full items-center">
			<button onclick={() => goto('/')}>
				<Icon attribute="arrow_left" size={28} color={colors.gray[600]} />
			</button>

			<div class="relative w-full pr-2">
				<input
					type="text"
					placeholder="검색어를 입력하세요"
					class="block w-full rounded-lg bg-gray-100 p-3 text-sm focus:outline-none"
				/>
				<div
					class="pointer-events-none absolute inset-y-0 right-1 flex items-center pr-3"
				>
					<Icon attribute="search" size={24} color={colors.gray[500]} />
				</div>
			</div>

			<!-- <label class="input w-full rounded-lg bg-gray-200 focus:outline-none">
				<input type="search" class="input input-ghost focus:outline-none" placeholder="Search" />

				<Icon attribute="search" size={24} color={colors.gray[500]} />
			</label> -->
		</div>
	</nav>
</header>

<main>
	<div class="mt-4">
		<TabSelector {tabs} bind:selected />
	</div>

	<article class="my-3 flex items-center justify-between px-4">
		<div class="flex items-center">
			<img
				src="https://randomuser.me/api/portraits/men/32.jpg"
				alt="devsangmin32"
				class="mr-2 h-8 w-8 rounded-full"
			/>
			<div class="flex flex-col">
				<p class="pr-4 text-sm font-medium">이상민</p>
				<p class="text-xs text-gray-400">@devsangmin32</p>
			</div>
		</div>

		<button class="btn btn-sm btn-primary h-6">팔로우</button>
	</article>
	<hr class="mt-2 border-gray-300" />
</main>
