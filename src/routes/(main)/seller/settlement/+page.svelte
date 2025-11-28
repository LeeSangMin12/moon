<script>
	import colors from '$lib/config/colors';
	import { get_user_context } from '$lib/contexts/app_context.svelte.js';
	import { comma, format_date, show_toast } from '$lib/utils/common';
	import { smart_go_back } from '$lib/utils/navigation.js';
	import { enhance } from '$app/forms';
	import {
		RiArrowLeftSLine,
		RiCheckboxBlankCircleLine,
		RiCheckboxCircleLine,
		RiCheckLine,
		RiCloseLine,
		RiTimeLine,
	} from 'svelte-remixicon';

	import Header from '$lib/components/ui/Header.svelte';

	const me = get_user_context();

	let { data, form } = $props();
	const {
		settleable_orders,
		settleable_amount,
		settlements,
		has_pending_settlement,
	} = data;

	// 선택된 주문 ID 목록
	let selected_order_ids = $state([]);

	// 계좌 정보
	let bank = $state('');
	let account_number = $state('');
	let account_holder = $state('');

	// 제출 중 여부
	let is_submitting = $state(false);

	// 선택된 주문 금액 합계
	let selected_amount = $derived.by(() => {
		return settleable_orders
			.filter((order) => selected_order_ids.includes(order.id))
			.reduce((total, order) => {
				const settlement_amount =
					order.total_with_commission +
					(order.coupon_discount || 0) -
					order.commission_amount;
				return total + settlement_amount;
			}, 0);
	});

	// 전체 선택 여부
	let is_all_selected = $derived(
		settleable_orders.length > 0 &&
			selected_order_ids.length === settleable_orders.length,
	);

	const toggle_order = (order_id) => {
		if (selected_order_ids.includes(order_id)) {
			selected_order_ids = selected_order_ids.filter((id) => id !== order_id);
		} else {
			selected_order_ids = [...selected_order_ids, order_id];
		}
	};

	const toggle_all = () => {
		if (is_all_selected) {
			selected_order_ids = [];
		} else {
			selected_order_ids = settleable_orders.map((order) => order.id);
		}
	};

	const BANKS = [
		'카카오뱅크',
		'농협은행',
		'국민은행',
		'토스뱅크',
		'신한은행',
		'우리은행',
		'기업은행',
		'하나은행',
		'새마을금고',
		'부산은행',
		'케이뱅크',
		'신협은행',
		'우체국',
		'SC제일',
		'광주은행',
		'경남은행',
		'수협은행',
		'전북은행',
		'제주은행',
		'씨티은행',
		'산업은행',
	];

	const get_status_badge = (status) => {
		switch (status) {
			case 'pending':
				return { text: '처리 중', class: 'bg-yellow-100 text-yellow-700' };
			case 'approved':
				return { text: '승인됨', class: 'bg-green-100 text-green-700' };
			case 'rejected':
				return { text: '거절됨', class: 'bg-red-100 text-red-700' };
			default:
				return { text: status, class: 'bg-gray-100 text-gray-700' };
		}
	};

	const TITLE = '정산하기';
</script>

<svelte:head>
	<title>{TITLE} | 문</title>
	<meta name="description" content="서비스 판매 수익을 정산 신청하세요." />
</svelte:head>

<Header>
	<button slot="left" onclick={smart_go_back}>
		<RiArrowLeftSLine size={24} color={colors.gray[600]} />
	</button>
	<h1 slot="center" class="font-semibold">{TITLE}</h1>
</Header>

<main class="min-h-screen bg-gray-50 pb-20">
	<!-- 정산 가능 금액 -->
	<div class="bg-white px-4 py-6">
		<div
			class="rounded-2xl bg-gradient-to-r from-blue-500 to-sky-500 p-5 text-white shadow-lg"
		>
			<p class="text-sm opacity-90">정산 가능 금액</p>
			<p class="mt-1 text-3xl font-bold">₩{comma(settleable_amount)}</p>
			{#if has_pending_settlement}
				<div
					class="mt-3 flex items-center gap-2 rounded-lg bg-white/20 px-3 py-2 text-sm"
				>
					<RiTimeLine size={16} />
					<span>정산 신청이 처리 중입니다</span>
				</div>
			{/if}
		</div>
	</div>

	{#if !has_pending_settlement && settleable_orders.length > 0}
		<!-- 정산 신청 폼 -->
		<form
			method="POST"
			action="?/request_settlement"
			use:enhance={() => {
				is_submitting = true;
				return async ({ result, update }) => {
					is_submitting = false;
					if (result.type === 'success' && result.data?.success) {
						show_toast(result.data.message, 'success');
						selected_order_ids = [];
						bank = '';
						account_number = '';
						account_holder = '';
					} else if (result.type === 'failure') {
						show_toast(result.data?.message || '오류가 발생했습니다', 'error');
					}
					await update();
				};
			}}
		>
			<input
				type="hidden"
				name="order_ids"
				value={selected_order_ids.join(',')}
			/>

			<!-- 정산할 주문 선택 -->
			<div class="mt-2 bg-white px-4 py-4">
				<div class="mb-4 flex items-center justify-between">
					<h2 class="font-semibold text-gray-900">정산할 주문 선택</h2>
					<button
						type="button"
						onclick={toggle_all}
						class="text-sm text-blue-600 hover:text-blue-700"
					>
						{is_all_selected ? '전체 해제' : '전체 선택'}
					</button>
				</div>

				<div class="space-y-3">
					{#each settleable_orders as order (order.id)}
						{@const settlement_amount =
							order.total_with_commission +
							(order.coupon_discount || 0) -
							order.commission_amount}
						<button
							type="button"
							onclick={() => toggle_order(order.id)}
							class="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition {selected_order_ids.includes(
								order.id,
							)
								? 'border-blue-500 bg-blue-50'
								: 'border-gray-200 hover:border-gray-300'}"
						>
							{#if selected_order_ids.includes(order.id)}
								<RiCheckboxCircleLine size={24} color={colors.blue[500]} />
							{:else}
								<RiCheckboxBlankCircleLine size={24} color={colors.gray[400]} />
							{/if}
							<div class="min-w-0 flex-1">
								<p class="truncate font-medium text-gray-900">
									{order.service_title}
								</p>
								<p class="mt-0.5 text-sm text-gray-500">
									{order.buyer?.name || '구매자'} · {format_date(
										order.completed_at,
									)}
								</p>
							</div>
							<p class="font-semibold text-gray-900">
								₩{comma(settlement_amount)}
							</p>
						</button>
					{/each}
				</div>

				{#if selected_order_ids.length > 0}
					<div class="mt-4 rounded-lg bg-blue-50 p-3">
						<div class="flex items-center justify-between">
							<span class="text-sm text-blue-700">선택된 정산 금액</span>
							<span class="font-bold text-blue-700"
								>₩{comma(selected_amount)}</span
							>
						</div>
					</div>
				{/if}
			</div>

			<!-- 계좌 정보 입력 -->
			<div class="mt-2 bg-white px-4 py-4">
				<h2 class="mb-4 font-semibold text-gray-900">입금받을 계좌 정보</h2>

				<div class="space-y-4">
					<div>
						<label
							for="bank"
							class="mb-1.5 block text-sm font-medium text-gray-700">은행</label
						>
						<select
							id="bank"
							name="bank"
							bind:value={bank}
							required
							class="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
						>
							<option value="">은행을 선택하세요</option>
							{#each BANKS as bank_name (bank_name)}
								<option value={bank_name}>{bank_name}</option>
							{/each}
						</select>
					</div>

					<div>
						<label
							for="account_number"
							class="mb-1.5 block text-sm font-medium text-gray-700"
						>
							계좌번호
						</label>
						<input
							type="text"
							id="account_number"
							name="account_number"
							bind:value={account_number}
							required
							placeholder="'-' 없이 입력"
							class="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
						/>
					</div>

					<div>
						<label
							for="account_holder"
							class="mb-1.5 block text-sm font-medium text-gray-700"
						>
							예금주
						</label>
						<input
							type="text"
							id="account_holder"
							name="account_holder"
							bind:value={account_holder}
							required
							placeholder="예금주명을 입력하세요"
							class="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
						/>
					</div>
				</div>
			</div>

			<!-- 제출 버튼 -->
			<div class="mt-4 px-4">
				<button
					type="submit"
					disabled={is_submitting ||
						selected_order_ids.length === 0 ||
						!bank ||
						!account_number ||
						!account_holder}
					class="w-full rounded-lg bg-blue-500 py-3.5 font-semibold text-white transition hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-300"
				>
					{#if is_submitting}
						정산 신청 중...
					{:else}
						₩{comma(selected_amount)} 정산 신청하기
					{/if}
				</button>
			</div>
		</form>
	{:else if !has_pending_settlement && settleable_orders.length === 0}
		<div class="mt-2 bg-white px-4 py-12 text-center">
			<p class="text-gray-500">정산 가능한 주문이 없습니다</p>
			<p class="mt-1 text-sm text-gray-400">
				완료된 주문이 있으면 정산할 수 있습니다
			</p>
		</div>
	{/if}

	<!-- 정산 내역 -->
	<div class="mt-2 bg-white px-4 py-4">
		<h2 class="mb-4 font-semibold text-gray-900">정산 내역</h2>

		{#if settlements.length > 0}
			<div class="space-y-3">
				{#each settlements as settlement (settlement.id)}
					{@const status_badge = get_status_badge(settlement.status)}
					<div class="rounded-lg border border-gray-200 p-4">
						<div class="flex items-start justify-between">
							<div>
								<p class="font-semibold text-gray-900">
									₩{comma(settlement.amount)}
								</p>
								<p class="mt-0.5 text-sm text-gray-500">
									{format_date(settlement.created_at)}
								</p>
							</div>
							<span
								class="rounded-full px-2.5 py-1 text-xs font-medium {status_badge.class}"
							>
								{status_badge.text}
							</span>
						</div>
						<div class="mt-2 text-sm text-gray-600">
							<p>{settlement.bank} {settlement.account_number}</p>
							<p>{settlement.account_holder}</p>
						</div>
						{#if settlement.status === 'rejected' && settlement.reject_reason}
							<div class="mt-2 rounded bg-red-50 p-2 text-sm text-red-700">
								거절 사유: {settlement.reject_reason}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{:else}
			<div class="py-8 text-center">
				<p class="text-gray-500">정산 내역이 없습니다</p>
			</div>
		{/if}
	</div>
</main>
