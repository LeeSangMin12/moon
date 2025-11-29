<script>
	import { get_user_context } from '$lib/contexts/app_context.svelte.js';
	import { comma } from '$lib/utils/common';
	import { smart_go_back } from '$lib/utils/navigation';
	import { RiArrowLeftSLine, RiArrowRightSLine } from 'svelte-remixicon';

	import Header from '$lib/components/ui/Header.svelte';

	const me = get_user_context();

	let { data } = $props();
	let { transactions, bank_account, pending_charges, pending_withdrawals, moon_cash } =
		$derived(data);

	const has_pending = $derived(
		pending_charges?.length > 0 || pending_withdrawals?.length > 0,
	);
	const pending_count = $derived(
		(pending_charges?.length || 0) + (pending_withdrawals?.length || 0),
	);

	const type_labels = {
		charge: '충전',
		withdraw: '출금',
		service_payment: '서비스 구매',
		service_income: '판매 수익',
		service_payout: '서비스 판매 수익',
		outsourcing_fee: '외주 등록',
		expert_payout: '외주 수익',
		gift_send: '선물 보내기',
		gift_receive: '선물 받기',
	};

	// 필터
	let filter = $state('all');
	const filters = [
		{ value: 'all', label: '전체' },
		{ value: 'in', label: '입금' },
		{ value: 'out', label: '출금' },
	];

	const filtered_transactions = $derived(() => {
		if (!transactions) return [];
		if (filter === 'all') return transactions;
		if (filter === 'in') return transactions.filter((t) => t.amount > 0);
		if (filter === 'out') return transactions.filter((t) => t.amount < 0);
		return transactions;
	});

	// 날짜별 그룹핑
	function group_by_date(txs) {
		const groups = {};
		for (const tx of txs) {
			const date = new Date(tx.created_at).toLocaleDateString('ko-KR', {
				year: 'numeric',
				month: 'long',
				day: 'numeric',
			});
			if (!groups[date]) groups[date] = [];
			groups[date].push(tx);
		}
		return Object.entries(groups);
	}

	const grouped_transactions = $derived(group_by_date(filtered_transactions()));
</script>

<svelte:head>
	<title>문캐시 | 문</title>
</svelte:head>

<Header>
	<button slot="left" onclick={smart_go_back}>
		<RiArrowLeftSLine size={24} class="text-gray-800" />
	</button>
	<span slot="center" class="text-[17px] font-semibold">문캐시</span>
</Header>

<main class="min-h-screen pb-24">
	<!-- 잔액 카드 -->
	<section class="bg-white px-5 pt-6 pb-5">
		<p class="text-[13px] text-gray-500">사용 가능한 캐시</p>
		<p class="mt-1 text-[32px] font-bold tracking-tight text-gray-900">
			{comma(moon_cash || 0)}<span class="text-[24px] font-semibold"
				>원</span
			>
		</p>

		{#if has_pending}
			<div class="mt-4 flex items-center gap-2 text-[13px]">
				<span
					class="inline-flex h-5 w-5 items-center justify-center rounded-full bg-orange-100 text-[11px] font-medium text-orange-600"
				>
					{pending_count}
				</span>
				<span class="text-gray-500">처리 대기 중인 요청이 있어요</span>
			</div>
		{/if}
	</section>

	<!-- 충전/출금 버튼 -->
	<section class=" bg-white px-5 py-4">
		<div class="flex gap-3">
			<a
				href={`/@${me?.handle}/accounts/cash/charge`}
				class="flex-1 rounded-xl bg-[#237BF8] py-3.5 text-center text-[15px] font-semibold text-white active:bg-blue-700"
			>
				충전하기
			</a>
			<a
				href={`/@${me?.handle}/accounts/cash/withdraw`}
				class="flex-1 rounded-xl bg-gray-100 py-3.5 text-center text-[15px] font-semibold text-gray-900 active:bg-gray-50"
			>
				출금하기
			</a>
		</div>
	</section>

	<!-- 거래내역 필터 탭 -->
	<section class="mt-2 border-b border-gray-100 bg-white">
		<div class="flex">
			{#each filters as f}
				<button
					onclick={() => (filter = f.value)}
					class="relative flex-1 py-3.5 text-[14px] font-medium transition
						{filter === f.value ? 'text-gray-900' : 'text-gray-400'}"
				>
					{f.label}
					{#if filter === f.value}
						<span
							class="absolute bottom-0 left-1/2 h-0.5 w-12 -translate-x-1/2 rounded-full bg-gray-900"
						></span>
					{/if}
				</button>
			{/each}
		</div>
	</section>

	<!-- 거래내역 -->
	{#if grouped_transactions.length > 0}
		{#each grouped_transactions as [date, txs]}
			<section class="mt-2 bg-white">
				<div class="border-b border-gray-50 px-5 py-3">
					<p class="text-[13px] text-gray-500">{date}</p>
				</div>
				<ul>
					{#each txs as tx}
						<li
							class="flex items-center justify-between border-b border-gray-50 px-5 py-4 last:border-b-0"
						>
							<div>
								<p class="text-[15px] text-gray-900">
									{type_labels[tx.type] || tx.type}
								</p>
								{#if tx.description}
									<p class="mt-0.5 text-[13px] text-gray-500">
										{tx.description}
									</p>
								{/if}
								<p class="mt-0.5 text-[12px] text-gray-400">
									{new Date(tx.created_at).toLocaleTimeString('ko-KR', {
										hour: '2-digit',
										minute: '2-digit',
									})}
								</p>
							</div>
							<div class="text-right">
								<p
									class="text-[15px] font-semibold {tx.amount > 0
										? 'text-blue-600'
										: 'text-gray-900'}"
								>
									{tx.amount > 0 ? '+' : ''}{comma(tx.amount)}원
								</p>
								<p class="mt-0.5 text-[12px] text-gray-400">
									잔액 {comma(tx.balance_after)}원
								</p>
							</div>
						</li>
					{/each}
				</ul>
			</section>
		{/each}
	{:else}
		<section class="mt-2 bg-white px-5 py-16 text-center">
			<p class="text-[14px] text-gray-400">
				{filter === 'all'
					? '거래 내역이 없어요'
					: '해당 유형의 거래 내역이 없어요'}
			</p>
		</section>
	{/if}
</main>
