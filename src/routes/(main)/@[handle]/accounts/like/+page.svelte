<script>
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { RiAddLine, RiArrowLeftSLine, RiHeartFill } from 'svelte-remixicon';

	import Bottom_nav from '$lib/components/ui/Bottom_nav/+page.svelte';
	import Header from '$lib/components/ui/Header/+page.svelte';
	import Icon from '$lib/components/ui/Icon/+page.svelte';
	import Service from '$lib/components/Service/+page.svelte';

	import colors from '$lib/js/colors';
	import { check_login, comma, show_toast } from '$lib/js/common';
	import { get_user_context, get_api_context } from '$lib/contexts/app-context.svelte.js';

	const { me } = get_user_context();
	const { api } = get_api_context();

	const TITLE = '좋아요한 서비스';

	let { data } = $props();
	let { services, service_likes } = $state(data);
</script>

<svelte:head>
	<title>좋아요한 서비스 | 문</title>
	<meta
		name="description"
		content="내가 좋아요한 서비스 목록을 한눈에 확인하고, 서비스를 쉽게 관리할 수 있는 문의 좋아요 페이지입니다."
	/>
</svelte:head>

<Header>
	<div slot="left">
		<button onclick={() => goto(`/@${me.handle}/accounts`)}>
			<RiArrowLeftSLine size={24} color={colors.gray[800]} />
		</button>
	</div>
	<h1 slot="center" class="font-semibold">{TITLE}</h1>
</Header>

<main>
	<div class="mt-4 grid grid-cols-2 gap-4 px-4">
		{#each services as service}
			{#if service.services}
				<Service service={service.services} {service_likes} />
			{/if}
		{/each}
	</div>
</main>
