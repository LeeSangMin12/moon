<script>
	import { RiArrowLeftSLine } from 'svelte-remixicon';

	import Header from '$lib/components/ui/Header/+page.svelte';

	import colors from '$lib/js/colors';
</script>

<svelte:head>
	<title>이벤트 | 문</title>
	<meta
		name="description"
		content="최신 이벤트 정보와 혜택을 확인하고, 문의 활동을 쉽게 관리할 수 있는 문의 이벤트 페이지입니다."
	/>
</svelte:head>

<Header>
	<div slot="left">
		<button class="flex items-center" onclick={() => history.back()}>
			<RiArrowLeftSLine size={24} color={colors.gray[600]} />
		</button>
	</div>

	<div slot="center">
		<h1 class="text-lg font-semibold">이벤트</h1>
	</div>
</Header>

<div class="flex h-full items-center justify-center">
	<p class="mt-20 text-xl font-semibold">준비중입니다</p>
</div>
