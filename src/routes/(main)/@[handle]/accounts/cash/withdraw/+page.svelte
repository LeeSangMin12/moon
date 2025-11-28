<script>
	import { get_user_context, get_api_context } from '$lib/contexts/app_context.svelte.js';
	import { comma, show_toast } from '$lib/utils/common';
	import { smart_go_back } from '$lib/utils/navigation';
	import { RiArrowLeftSLine, RiArrowRightSLine } from 'svelte-remixicon';

	import Header from '$lib/components/ui/Header.svelte';

	const me = get_user_context();
	const api = get_api_context();

	let { data } = $props();
	let bank_account = $derived(data.bank_account);
	let pending_withdrawals = $state(data.pending_withdrawals || []);

	// 폼
	let amount = $state('');
	let submitting = $state(false);

	const amounts = [10000, 30000, 50000, 100000];
	const balance = $derived(me?.moon_cash || 0);

	function set_amount(val) {
		amount = String(Math.min(val, balance));
	}

	function set_all() {
		amount = String(balance);
	}

	function on_amount_input(e) {
		const val = e.target.value.replace(/[^0-9]/g, '');
		amount = val;
	}

	const num_amount = $derived(Number(amount) || 0);
	const display_amount = $derived(amount ? comma(num_amount) : '');
	const is_over = $derived(num_amount > balance);
	const can_submit = $derived(num_amount >= 1000 && num_amount <= balance && bank_account);

	async function submit() {
		if (!can_submit || submitting) return;

		submitting = true;
		try {
			const result = await api.cash_withdrawals.insert({
				user_id: me.id,
				bank_account_id: bank_account.id,
				amount: num_amount,
			});
			pending_withdrawals = [result, ...pending_withdrawals];
			amount = '';
			show_toast('success', '출금 신청이 완료되었어요');
		} catch (e) {
			show_toast('error', '출금 신청에 실패했어요');
		} finally {
			submitting = false;
		}
	}
</script>

<svelte:head>
	<title>출금하기 | 문</title>
</svelte:head>

<Header>
	<button slot="left" onclick={smart_go_back}>
		<RiArrowLeftSLine size={24} class="text-gray-800" />
	</button>
	<span slot="center" class="text-[17px] font-semibold">출금하기</span>
</Header>

<main class="bg-gray-50 min-h-screen pb-32">
	<!-- 잔액 -->
	<section class="bg-white px-5 py-5">
		<p class="text-[13px] text-gray-500">출금 가능</p>
		<p class="mt-1 text-[24px] font-bold text-gray-900">{comma(balance)}원</p>
	</section>

	<!-- 출금 계좌 -->
	<section class="bg-white mt-2">
		<a
			href={`/@${me?.handle}/accounts/cash/bank-account`}
			class="flex items-center justify-between px-5 py-4 active:bg-gray-50"
		>
			<div>
				<p class="text-[13px] text-gray-500">출금 계좌</p>
				{#if bank_account}
					<p class="mt-1 text-[15px] font-medium text-gray-900">
						{bank_account.bank} {bank_account.account_number}
					</p>
					<p class="text-[13px] text-gray-500">{bank_account.account_holder}</p>
				{:else}
					<p class="mt-1 text-[15px] font-medium text-orange-500">계좌를 등록해주세요</p>
				{/if}
			</div>
			<RiArrowRightSLine size={20} class="text-gray-400" />
		</a>
	</section>

	{#if bank_account}
		<!-- 금액 입력 -->
		<section class="bg-white mt-2 px-5 py-5">
			<p class="text-[13px] text-gray-500">출금 금액</p>
			<div class="mt-3 relative">
				<input
					type="text"
					inputmode="numeric"
					value={display_amount}
					oninput={on_amount_input}
					placeholder="0"
					class="w-full text-[28px] font-bold placeholder-gray-300 border-0 border-b-2 pb-2 focus:outline-none bg-transparent
						{is_over ? 'text-red-500 border-red-300 focus:border-red-500' : 'text-gray-900 border-gray-200 focus:border-gray-900'}"
				/>
				<span class="absolute right-0 bottom-2 text-[20px] font-semibold text-gray-400">원</span>
			</div>

			{#if is_over}
				<p class="mt-2 text-[13px] text-red-500">잔액이 부족해요</p>
			{/if}

			<div class="mt-4 flex gap-2">
				{#each amounts as amt}
					<button
						onclick={() => set_amount(amt)}
						disabled={amt > balance}
						class="flex-1 py-2.5 text-[13px] font-medium rounded-lg
							{amt > balance
								? 'bg-gray-50 text-gray-300 cursor-not-allowed'
								: 'bg-gray-100 text-gray-700 active:bg-gray-200'}"
					>
						+{comma(amt)}
					</button>
				{/each}
			</div>

			<button
				onclick={set_all}
				class="mt-2 w-full py-2.5 text-[13px] font-medium text-gray-700 bg-gray-100 rounded-lg active:bg-gray-200"
			>
				전액
			</button>
		</section>
	{/if}

	<!-- 대기 중 -->
	{#if pending_withdrawals.length > 0}
		<section class="bg-white mt-2 px-5 py-5">
			<p class="text-[13px] text-gray-500">대기 중인 출금</p>
			<ul class="mt-3 space-y-3">
				{#each pending_withdrawals as w}
					<li class="flex items-center justify-between py-2">
						<div>
							<p class="text-[15px] font-medium text-gray-900">{comma(w.amount)}원</p>
							{#if w.bank_account}
								<p class="text-[12px] text-gray-400">{w.bank_account.bank}</p>
							{/if}
						</div>
						<span class="text-[13px] font-medium text-orange-500">처리 중</span>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	<!-- 안내 -->
	<section class="px-5 py-5">
		<ul class="space-y-1.5 text-[12px] text-gray-400">
			<li>• 출금 수수료는 무료예요</li>
			<li>• 영업일 기준 1~2일 내 처리됩니다</li>
			<li>• 최소 출금 금액은 1,000원입니다</li>
		</ul>
	</section>
</main>

<!-- 하단 버튼 -->
{#if bank_account}
	<div class="fixed bottom-0 w-full max-w-screen-md bg-white p-4">
		<div class="pb-safe">
			<button
				onclick={submit}
				disabled={!can_submit || submitting}
				class="btn btn-primary w-full"
			>
				{submitting ? '처리 중...' : '출금 신청하기'}
			</button>
		</div>
	</div>
{/if}
