<script>
	import colors from '$lib/config/colors';
	import { get_user_context } from '$lib/contexts/app_context.svelte.js';
	import { comma } from '$lib/utils/common';
	import { goto } from '$app/navigation';
	import {
		RiArrowLeftSLine,
		RiArrowRightSLine,
		RiBriefcaseLine,
		RiCupLine,
		RiFileList3Line,
		RiMoneyDollarCircleLine,
		RiShoppingBag3Line,
	} from 'svelte-remixicon';

	import Header from '$lib/components/ui/Header.svelte';

	const me = get_user_context();

	let { data } = $props();
	const { settleable_amount, has_pending_settlement, stats } = data;

	const TITLE = '판매자 센터';
</script>

<svelte:head>
	<title>{TITLE} | 문</title>
	<meta
		name="description"
		content="서비스 판매, 정산, 외주 관리를 한눈에 확인하세요."
	/>
</svelte:head>

<Header>
	<button slot="left" onclick={() => history.back()}>
		<RiArrowLeftSLine size={24} color={colors.gray[600]} />
	</button>
	<h1 slot="center" class="font-semibold">{TITLE}</h1>
</Header>

<main class="min-h-screen bg-gray-50 pb-20">
	<!-- 정산 가능 금액 카드 -->
	<div class="bg-white px-4 py-6">
		<div
			class="rounded-2xl bg-gradient-to-r from-blue-500 to-sky-500 p-5 text-white shadow-lg"
		>
			<div class="flex items-center justify-between">
				<div>
					<p class="text-sm opacity-90">정산 가능 금액</p>
					<p class="mt-1 text-3xl font-bold">₩{comma(settleable_amount)}</p>
				</div>
				<RiMoneyDollarCircleLine size={48} class="opacity-30" />
			</div>

			{#if has_pending_settlement}
				<div class="mt-4 rounded-lg bg-white/20 px-3 py-2 text-sm">
					정산 신청이 처리 중입니다
				</div>
			{:else if settleable_amount > 0}
				<button
					onclick={() => goto('/seller/settlement')}
					class="mt-4 w-full rounded-lg bg-white py-2.5 text-center font-semibold text-blue-600 transition hover:bg-gray-50"
				>
					정산 신청하기
				</button>
			{:else}
				<div class="mt-4 rounded-lg bg-white/20 px-3 py-2 text-center text-sm">
					정산 가능한 금액이 없습니다
				</div>
			{/if}
		</div>
	</div>

	<!-- 판매 통계 -->
	<div class="mt-2 bg-white px-4 py-4">
		<div class="grid grid-cols-3 gap-4 text-center">
			<div>
				<p class="text-2xl font-bold text-gray-900">{stats.total_sales}</p>
				<p class="mt-1 text-xs text-gray-500">전체 판매</p>
			</div>
			<div>
				<p class="text-2xl font-bold text-blue-600">{stats.pending_sales}</p>
				<p class="mt-1 text-xs text-gray-500">진행 중</p>
			</div>
			<div>
				<p class="text-2xl font-bold text-green-600">{stats.completed_sales}</p>
				<p class="mt-1 text-xs text-gray-500">완료</p>
			</div>
		</div>
	</div>

	<!-- 메뉴 리스트 -->
	<div class="mt-2 bg-white">
		<p class="px-4 pt-5 pb-2 text-sm font-semibold text-gray-500">판매 관리</p>

		<a
			href={`/@${me?.handle}/accounts/orders`}
			class="flex items-center justify-between px-4 py-4 transition hover:bg-gray-50"
		>
			<div class="flex items-center">
				<RiShoppingBag3Line size={22} color={colors.gray[600]} class="mr-3" />
				<span>서비스 판매 관리</span>
			</div>
			<RiArrowRightSLine size={20} color={colors.gray[400]} />
		</a>

		<a
			href="/seller/settlement"
			class="flex items-center justify-between px-4 py-4 transition hover:bg-gray-50"
		>
			<div class="flex items-center">
				<RiFileList3Line size={22} color={colors.gray[600]} class="mr-3" />
				<span>정산 내역</span>
			</div>
			<RiArrowRightSLine size={20} color={colors.gray[400]} />
		</a>
	</div>

	<div class="mt-2 bg-white">
		<p class="px-4 pt-5 pb-2 text-sm font-semibold text-gray-500">외주 관리</p>

		<a
			href="/expert/accounts"
			class="flex items-center justify-between px-4 py-4 transition hover:bg-gray-50"
		>
			<div class="flex items-center">
				<RiBriefcaseLine size={22} color={colors.gray[600]} class="mr-3" />
				<span>사이드·풀타임 잡 관리</span>
			</div>
			<RiArrowRightSLine size={20} color={colors.gray[400]} />
		</a>
	</div>
</main>
