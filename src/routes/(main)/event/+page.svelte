<script>
	import colors from '$lib/config/colors';
	import { get_user_context } from '$lib/contexts/app_context.svelte.js';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { RiArrowLeftSLine } from 'svelte-remixicon';

	import Header from '$lib/components/ui/Header.svelte';

	const TITLE = '이벤트';

	const me = get_user_context();

	let screen_size;
</script>

<svelte:head>
	<title>{TITLE} | 문</title>
	<meta name="description" content="문의 이벤트 페이지입니다." />
</svelte:head>

<Header>
	<div slot="left">
		<a
			class="flex items-center"
			href={me.handle === '비회원' ? '/' : `/@${me?.handle}/accounts`}
		>
			<RiArrowLeftSLine size={24} color={colors.gray[600]} />
		</a>
	</div>
	<h1 slot="center" class="font-semibold">{TITLE}</h1>
</Header>

<svelte:window bind:innerWidth={screen_size} />

<main>
	{#if screen_size < 480}
		<div class="flex flex-col gap-6 px-4 pt-4">
			<a href="/event/5,000_coupon" aria-label="5,000원 쿠폰 이벤트">
				<enhanced:img
					class="h-[101px] w-full rounded-xl object-cover drop-shadow-sm"
					src="$lib/img/common/banner/5,000_coupon.png"
				/>
			</a>

			<a href="/event/free_outsourcing" aria-label="무료 외주 이벤트">
				<enhanced:img
					class="h-[101px] w-full rounded-xl object-cover drop-shadow-sm"
					src="$lib/img/common/banner/free_outsourcing.png"
				/>
			</a>
		</div>
	{:else}
		<div class="grid grid-cols-2 gap-6 px-4 pt-4">
			<a href="/event/5,000_coupon" aria-label="5,000원 쿠폰 이벤트">
				<enhanced:img
					class="h-[101px] w-full rounded-xl object-cover drop-shadow-sm"
					src="$lib/img/common/banner/5,000_coupon.png"
				/>
			</a>

			<a href="/event/free_outsourcing" aria-label="무료 외주 이벤트">
				<enhanced:img
					class="h-[101px] w-full rounded-xl object-contain drop-shadow-sm"
					src="$lib/img/common/banner/free_outsourcing.png"
				/>
			</a>
		</div>
	{/if}
</main>
