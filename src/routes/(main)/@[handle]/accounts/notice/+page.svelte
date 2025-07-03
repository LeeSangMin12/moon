<script>
	import { RiArrowLeftSLine } from 'svelte-remixicon';

	import Header from '$lib/components/ui/Header/+page.svelte';

	import colors from '$lib/js/colors';
</script>

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
