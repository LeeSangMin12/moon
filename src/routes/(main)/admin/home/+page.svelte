<script>
	import { goto } from '$app/navigation';
	import { RiArrowLeftSLine } from 'svelte-remixicon';
	import { smartGoBack } from '$lib/utils/navigation';

	import Header from '$lib/components/ui/Header.svelte';

	import colors from '$lib/config/colors';
</script>

<Header>
	<button slot="left" onclick={smartGoBack}>
		<RiArrowLeftSLine size={26} color={colors.gray[600]} />
	</button>
</Header>

<div class="container mx-auto max-w-7xl px-4 py-8">
	<h1 class="text-3xl font-bold text-gray-900">Admin</h1>

	<div class="mt-4 flex flex-col gap-4">
		<a href="/admin/moon-charges">문 충전 관리</a>
		<a href="/admin/withdrawals">출금 관리</a>
		<a href="/admin/account-transition">계정 전환</a>
		<a href="/admin/bulk-accounts">대량 계정 생성</a>
	</div>
</div>
