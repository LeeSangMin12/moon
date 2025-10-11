<script>
	import { RiArrowLeftSLine } from 'svelte-remixicon';

	import Header from '$lib/components/ui/Header.svelte';

	import colors from '$lib/config/colors';
</script>

<svelte:head>
	<title>공지사항 | 문</title>
	<meta
		name="description"
		content="문의 바뀐 정보를 확인하고, 최신 공지사항을 확인할 수 있는 문의 공지사항 페이지입니다."
	/>
</svelte:head>

<Header>
	<div slot="left">
		<button class="flex items-center" onclick={() => history.back()}>
			<RiArrowLeftSLine size={24} color={colors.gray[600]} />
		</button>
	</div>

	<div slot="center">
		<h1 class="text-lg font-semibold">공지사항</h1>
	</div>
</Header>

<div class="flex h-full items-center justify-center">
	<p class="mt-20 text-xl font-semibold">준비중입니다</p>
</div>
