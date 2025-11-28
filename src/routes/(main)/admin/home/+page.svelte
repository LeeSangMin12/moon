<script>
	import colors from '$lib/config/colors';
	import { smart_go_back } from '$lib/utils/navigation';
	import { goto } from '$app/navigation';
	import { RiArrowLeftSLine } from 'svelte-remixicon';

	import Header from '$lib/components/ui/Header.svelte';
</script>

<Header>
	<button slot="left" onclick={smart_go_back}>
		<RiArrowLeftSLine size={26} color={colors.gray[600]} />
	</button>
</Header>

<div class="container mx-auto max-w-7xl px-4 py-8">
	<h1 class="text-3xl font-bold text-gray-900">Admin</h1>

	<div class="mt-6">
		<h2 class="mb-3 text-lg font-semibold text-gray-700">문캐시 관리</h2>
		<div class="flex flex-col gap-2 rounded-lg bg-gray-50 p-4">
			<a href="/admin/cash-charges" class="text-blue-600 hover:underline">문캐시 충전 관리</a>
			<a href="/admin/cash-withdrawals" class="text-blue-600 hover:underline">문캐시 출금 관리</a>
		</div>
	</div>

	<div class="mt-6">
		<h2 class="mb-3 text-lg font-semibold text-gray-700">서비스 관리</h2>
		<div class="flex flex-col gap-2 rounded-lg bg-gray-50 p-4">
			<a href="/admin/expert-requests" class="text-blue-600 hover:underline">사이드·풀타임 잡 관리</a>
			<a href="/admin/settlements" class="text-blue-600 hover:underline">판매자 정산 관리</a>
		</div>
	</div>

	<div class="mt-6">
		<h2 class="mb-3 text-lg font-semibold text-gray-700">사용자 관리</h2>
		<div class="flex flex-col gap-2 rounded-lg bg-gray-50 p-4">
			<a href="/admin/account-transition" class="text-blue-600 hover:underline">계정 전환</a>
			<a href="/admin/bulk-accounts" class="text-blue-600 hover:underline">대량 계정 생성</a>
		</div>
	</div>

	<div class="mt-6">
		<h2 class="mb-3 text-lg font-semibold text-gray-700">기존 시스템 (Deprecated)</h2>
		<div class="flex flex-col gap-2 rounded-lg bg-gray-100 p-4 opacity-60">
			<a href="/admin/moon-charges" class="text-gray-500 hover:underline">문 충전 관리 (구)</a>
			<a href="/admin/withdrawals" class="text-gray-500 hover:underline">출금 관리 (구)</a>
		</div>
	</div>
</div>
