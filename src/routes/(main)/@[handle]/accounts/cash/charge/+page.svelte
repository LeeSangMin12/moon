<script>
	import {
		get_api_context,
		get_user_context,
	} from '$lib/contexts/app_context.svelte.js';
	import { comma, copy_to_clipboard, show_toast } from '$lib/utils/common';
	import { smart_go_back } from '$lib/utils/navigation';
	import { onMount } from 'svelte';
	import {
		RiAddLine,
		RiArrowLeftSLine,
		RiCheckLine,
		RiFileCopyLine,
	} from 'svelte-remixicon';

	import AddBankAccountModal from '$lib/components/AddBankAccountModal.svelte';
	import Header from '$lib/components/ui/Header.svelte';

	const me = get_user_context();
	const api = get_api_context();

	let { data } = $props();
	let pending_charges = $state(data.pending_charges || []);

	// 입금 계좌
	const deposit_info = {
		bank: '부산은행',
		number: '101-2094-2262-04',
		holder: '퓨처밴스 이상민',
	};

	// 내 계좌 목록
	let bank_accounts = $state([]);
	let selected_account_id = $state(null);
	let show_add_account_modal = $state(false);

	onMount(async () => {
		try {
			bank_accounts = await api.user_bank_accounts.select_by_user_id(me.id);
			// 기본 계좌가 있으면 자동 선택
			const default_account = bank_accounts.find((a) => a.is_default);
			if (default_account) {
				selected_account_id = default_account.id;
				depositor = default_account.account_holder;
			}
		} catch (e) {
			console.error('Failed to load bank accounts:', e);
		}
	});

	function select_account(account) {
		selected_account_id = account.id;
		depositor = account.account_holder;
	}

	function handle_account_added(new_account) {
		bank_accounts = [new_account, ...bank_accounts];
		select_account(new_account);
	}

	// 폼
	let amount = $state('');
	let depositor = $state('');
	let submitting = $state(false);

	const amounts = [1000, 10000, 50000, 100000, 500000];

	function set_amount(val) {
		amount = String(val);
	}

	function add_amount(val) {
		const current = Number(amount) || 0;
		amount = String(current + val);
	}

	function on_amount_input(e) {
		amount = e.target.value.replace(/[^0-9]/g, '');
	}

	const display_amount = $derived(amount ? comma(Number(amount)) : '');
	const can_submit = $derived(
		Number(amount) >= 1000 && selected_account_id !== null,
	);

	async function submit() {
		if (!can_submit || submitting) return;

		submitting = true;
		try {
			const result = await api.cash_charges.insert({
				user_id: me.id,
				amount: Number(amount),
				depositor_name: depositor.trim(),
			});
			pending_charges = [result, ...pending_charges];
			amount = '';
			depositor = '';
			show_toast('success', '충전 신청이 완료되었어요');
		} catch (e) {
			show_toast('error', '충전 신청에 실패했어요');
		} finally {
			submitting = false;
		}
	}

	const copy_account = async () => {
		await copy_to_clipboard(deposit_info.number, '계좌가 복사되었습니다.');
	};
</script>

<svelte:head>
	<title>충전하기 | 문</title>
</svelte:head>

<Header>
	<button slot="left" onclick={smart_go_back}>
		<RiArrowLeftSLine size={24} class="text-gray-800" />
	</button>
	<span slot="center" class="text-[17px] font-semibold">충전하기</span>
</Header>

<main class="min-h-screen bg-gray-50 pb-32">
	<!-- 입금 계좌 -->
	<section class="bg-white px-5 py-5">
		<p class="text-[13px] text-gray-500">입금 계좌</p>
		<div class="mt-3 flex items-center justify-between">
			<div>
				<p class="text-[15px] font-medium text-gray-900">{deposit_info.bank}</p>
				<p class="mt-0.5 text-[18px] font-bold text-gray-900">
					{deposit_info.number}
				</p>
				<p class="mt-0.5 text-[13px] text-gray-500">
					예금주: {deposit_info.holder}
				</p>
			</div>
			<button
				onclick={copy_account}
				class="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 active:bg-gray-200"
			>
				<RiFileCopyLine size={18} class="text-gray-600" />
			</button>
		</div>
	</section>

	<!-- 금액 입력 -->
	<section class="mt-2 bg-white px-5 py-5">
		<p class="text-[13px] text-gray-500">충전 금액</p>
		<div class="relative mt-3">
			<input
				type="text"
				inputmode="numeric"
				value={display_amount}
				oninput={on_amount_input}
				placeholder="0"
				class="w-full border-0 border-b-2 border-gray-200 bg-transparent pb-2 text-[28px] font-bold text-gray-900 placeholder-gray-300 focus:border-gray-900 focus:outline-none"
			/>
			<span
				class="absolute right-0 bottom-2 text-[20px] font-semibold text-gray-400"
				>원</span
			>
		</div>

		<div class="mt-4 flex gap-2">
			{#each amounts as amt}
				<button
					onclick={() => add_amount(amt)}
					class="flex-1 rounded-lg bg-gray-100 py-2.5 text-[13px] font-medium text-gray-700 active:bg-gray-200"
				>
					+{comma(amt)}
				</button>
			{/each}
		</div>
	</section>

	<!-- 입금자명 (계좌 선택) -->
	<section class="mt-2 bg-white px-5 py-5">
		<p class="text-[13px] text-gray-500">입금자 계좌</p>

		{#if bank_accounts.length > 0}
			<div class="mt-3 space-y-2">
				{#each bank_accounts as account (account.id)}
					<button
						onclick={() => select_account(account)}
						class="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition
							{selected_account_id === account.id
							? 'border-blue-500 bg-blue-50'
							: 'border-gray-200'}"
					>
						<div
							class="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2
								{selected_account_id === account.id
								? 'border-blue-500 bg-blue-500'
								: 'border-gray-300'}"
						>
							{#if selected_account_id === account.id}
								<RiCheckLine size={12} class="text-white" />
							{/if}
						</div>
						<div class="min-w-0 flex-1">
							<p class="truncate text-[14px] font-medium text-gray-900">
								{account.bank} {account.account_number}
							</p>
							<p class="text-[12px] text-gray-500">
								{account.account_holder}
							</p>
						</div>
					</button>
				{/each}
			</div>

			<button
				onclick={() => (show_add_account_modal = true)}
				class="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-300 py-3 text-[14px] text-gray-500"
			>
				<RiAddLine size={16} />
				다른 계좌 추가
			</button>
		{:else}
			<button
				onclick={() => (show_add_account_modal = true)}
				class="mt-3 flex w-full flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-6 text-center"
			>
				<div
					class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50"
				>
					<RiAddLine size={20} class="text-blue-500" />
				</div>
				<p class="mt-2 text-[14px] font-medium text-gray-600">계좌 등록하기</p>
				<p class="mt-1 text-[12px] text-gray-400">
					입금자명 확인을 위해 계좌를 등록해주세요
				</p>
			</button>
		{/if}
	</section>

	<!-- 대기 중 -->
	{#if pending_charges.length > 0}
		<section class="mt-2 bg-white px-5 py-5">
			<p class="text-[13px] text-gray-500">대기 중인 충전</p>
			<ul class="mt-3 space-y-3">
				{#each pending_charges as c}
					<li class="flex items-center justify-between py-2">
						<div>
							<p class="text-[15px] font-medium text-gray-900">
								{comma(c.amount)}원
							</p>
							<p class="text-[12px] text-gray-400">{c.depositor_name}</p>
						</div>
						<span class="text-[13px] font-medium text-orange-500">확인 중</span>
					</li>
				{/each}
			</ul>
		</section>
	{/if}

	<!-- 안내 -->
	<section class="px-5 py-5">
		<ul class="space-y-1.5 text-[12px] text-gray-400">
			<li>• 입금 후 충전 신청을 해주세요</li>
			<li>• 영업일 기준 1일 내 처리됩니다</li>
			<li>• 최소 충전 금액은 1,000원입니다</li>
		</ul>
	</section>
</main>

<!-- 하단 버튼 -->
<div class="fixed bottom-0 w-full max-w-screen-md bg-white p-4">
	<div class="pb-safe">
		<button
			onclick={submit}
			disabled={!can_submit || submitting}
			class="btn btn-primary w-full"
		>
			{submitting ? '처리 중...' : '충전 신청하기'}
		</button>
	</div>
</div>

<!-- 계좌 추가 모달 -->
<AddBankAccountModal
	bind:is_modal_open={show_add_account_modal}
	onSuccess={handle_account_added}
/>
