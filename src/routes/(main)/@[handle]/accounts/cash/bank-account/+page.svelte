<script>
	import {
		get_api_context,
		get_user_context,
	} from '$lib/contexts/app_context.svelte.js';
	import { show_toast } from '$lib/utils/common';
	import { smart_go_back } from '$lib/utils/navigation';
	import Select from 'svelte-select';
	import {
		RiAddLine,
		RiArrowLeftSLine,
		RiCheckLine,
		RiDeleteBinLine,
	} from 'svelte-remixicon';

	import Header from '$lib/components/ui/Header.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';

	const me = get_user_context();
	const api = get_api_context();

	let { data } = $props();
	let bank_accounts = $state(data.bank_accounts || []);

	// 모달 상태
	let show_modal = $state(false);
	let show_delete_modal = $state(false);
	let account_to_delete = $state(null);
	let submitting = $state(false);

	// 폼 상태
	let form = $state({
		account_type: 'individual',
		bank: '',
		account_number: '',
		account_holder: '',
		resident_number: '',
		business_number: '',
	});

	// 은행 목록
	const banks = [
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

	const bank_items = banks.map((bank) => ({ label: bank, value: bank }));
	let selected_bank = $state(null);

	function reset_form() {
		form = {
			account_type: 'individual',
			bank: '',
			account_number: '',
			account_holder: '',
			resident_number: '',
			business_number: '',
		};
		selected_bank = null;
	}

	function open_modal() {
		reset_form();
		show_modal = true;
	}

	function close_modal() {
		show_modal = false;
	}

	const is_valid = $derived(
		selected_bank &&
			form.account_number.length >= 10 &&
			form.account_holder.length >= 2 &&
			(form.account_type === 'individual'
				? form.resident_number.length === 13
				: form.business_number.length === 10),
	);

	async function handle_submit() {
		if (!is_valid || submitting) return;

		submitting = true;
		try {
			const new_account = await api.user_bank_accounts.insert({
				user_id: me.id,
				account_type: form.account_type,
				bank: selected_bank.value,
				account_number: form.account_number.replace(/[^0-9]/g, ''),
				account_holder: form.account_holder,
				resident_number:
					form.account_type === 'individual'
						? form.resident_number.replace(/[^0-9]/g, '')
						: null,
				business_number:
					form.account_type === 'business'
						? form.business_number.replace(/[^0-9]/g, '')
						: null,
			});

			bank_accounts = bank_accounts.map((a) => ({ ...a, is_default: false }));
			bank_accounts = [new_account, ...bank_accounts];

			close_modal();
			show_toast('success', '계좌가 등록되었어요');
		} catch (err) {
			console.error('Add bank account error:', err);
			show_toast('error', '계좌 등록에 실패했어요');
		} finally {
			submitting = false;
		}
	}

	async function set_default(account) {
		if (account.is_default) return;

		try {
			await api.user_bank_accounts.set_default(account.id, me.id);
			bank_accounts = bank_accounts.map((a) => ({
				...a,
				is_default: a.id === account.id,
			}));
			show_toast('success', '기본 계좌로 설정되었어요');
		} catch (err) {
			console.error('Set default error:', err);
			show_toast('error', '설정에 실패했어요');
		}
	}

	function open_delete_modal(account) {
		account_to_delete = account;
		show_delete_modal = true;
	}

	async function confirm_delete() {
		if (!account_to_delete) return;

		try {
			await api.user_bank_accounts.delete(account_to_delete.id);
			bank_accounts = bank_accounts.filter((a) => a.id !== account_to_delete.id);
			show_toast('success', '계좌가 삭제되었어요');
		} catch (err) {
			console.error('Delete account error:', err);
			show_toast('error', '삭제에 실패했어요');
		} finally {
			show_delete_modal = false;
			account_to_delete = null;
		}
	}

	function on_resident_input(e) {
		let value = e.target.value.replace(/[^0-9]/g, '');
		if (value.length > 13) value = value.slice(0, 13);
		form.resident_number = value;
	}

	function on_business_input(e) {
		let value = e.target.value.replace(/[^0-9]/g, '');
		if (value.length > 10) value = value.slice(0, 10);
		form.business_number = value;
	}

	function on_account_input(e) {
		form.account_number = e.target.value.replace(/[^0-9-]/g, '');
	}

	const display_resident = $derived(() => {
		const num = form.resident_number;
		if (num.length <= 6) return num;
		return num.slice(0, 6) + '-' + num.slice(6);
	});

	const display_business = $derived(() => {
		const num = form.business_number;
		if (num.length <= 3) return num;
		if (num.length <= 5) return num.slice(0, 3) + '-' + num.slice(3);
		return num.slice(0, 3) + '-' + num.slice(3, 5) + '-' + num.slice(5);
	});
</script>

<svelte:head>
	<title>출금 계좌 | 문</title>
</svelte:head>

<Header>
	<button slot="left" onclick={smart_go_back}>
		<RiArrowLeftSLine size={24} class="text-gray-800" />
	</button>
	<span slot="center" class="text-[17px] font-semibold">출금 계좌</span>
</Header>

<main class="min-h-screen bg-gray-50 pb-32">
	<!-- 등록된 계좌 -->
	{#if bank_accounts.length > 0}
		<section class="bg-white">
			<ul>
				{#each bank_accounts as account}
					<li
						class="flex items-center justify-between border-b border-gray-50 px-5 py-4 last:border-b-0"
					>
						<button
							onclick={() => set_default(account)}
							class="flex flex-1 items-center gap-3 text-left"
						>
							<div
								class="flex h-5 w-5 items-center justify-center rounded-full border-2
									{account.is_default ? 'border-gray-900 bg-gray-900' : 'border-gray-300'}"
							>
								{#if account.is_default}
									<RiCheckLine size={12} class="text-white" />
								{/if}
							</div>
							<div>
								<p class="text-[15px] font-medium text-gray-900">
									{account.bank}
									{#if account.is_default}
										<span class="ml-1 text-[12px] text-blue-600">기본</span>
									{/if}
								</p>
								<p class="mt-0.5 text-[14px] text-gray-500">
									{account.account_number}
								</p>
								<p class="text-[13px] text-gray-400">
									{account.account_holder}
								</p>
							</div>
						</button>
						<button
							onclick={() => open_delete_modal(account)}
							class="p-2 text-gray-400 active:text-red-500"
						>
							<RiDeleteBinLine size={18} />
						</button>
					</li>
				{/each}
			</ul>
		</section>
	{:else}
		<section class="bg-white px-5 py-16 text-center">
			<p class="text-[14px] text-gray-400">등록된 계좌가 없어요</p>
		</section>
	{/if}

	<!-- 안내 -->
	<section class="px-5 py-5">
		<ul class="space-y-1.5 text-[12px] text-gray-400">
			<li>• 본인 명의의 계좌만 등록할 수 있어요</li>
			<li>• 주민등록번호는 원천징수 신고에 사용돼요</li>
			<li>• 입력한 정보는 안전하게 암호화되어 저장돼요</li>
		</ul>
	</section>
</main>

<!-- 하단 버튼 -->
<div class="fixed bottom-0 w-full max-w-screen-md bg-white p-4">
	<div class="pb-safe">
		<button onclick={open_modal} class="btn btn-primary w-full">
			계좌 추가하기
		</button>
	</div>
</div>

<!-- 계좌 추가 모달 -->
<Modal bind:is_modal_open={show_modal} modal_position="bottom">
	<div class="flex flex-col items-center p-4">
		<div class="h-1 w-10 self-center rounded-full bg-gray-300"></div>

		<h3 class="mt-4 text-[17px] font-semibold">계좌 등록</h3>

		<!-- 폼 -->
		<div class="pb-safe mt-4 w-full">
			<!-- 계좌 유형 -->
			<div>
				<p class="text-[13px] text-gray-500">계좌 유형</p>
				<div class="mt-2 flex gap-2">
					<button
						onclick={() => (form.account_type = 'individual')}
						class="flex-1 rounded-lg border py-3 text-[14px] font-medium transition
							{form.account_type === 'individual'
							? 'border-primary bg-primary text-white'
							: 'border-gray-100 bg-gray-100 text-gray-600'}"
					>
						개인
					</button>
					<button
						onclick={() => (form.account_type = 'business')}
						class="flex-1 rounded-lg border py-3 text-[14px] font-medium transition
							{form.account_type === 'business'
							? 'border-primary bg-primary text-white'
							: 'border-gray-100 bg-gray-100 text-gray-600'}"
					>
						사업자
					</button>
				</div>
			</div>

			<!-- 은행 선택 -->
			<div class="mt-5">
				<p class="text-[13px] text-gray-500">은행</p>
				<div class="mt-2">
					<Select
						items={bank_items}
						bind:value={selected_bank}
						placeholder="은행 선택"
						--border-radius="0.5rem"
						--padding="0 1rem"
						--height="48px"
						--font-size="15px"
						--border="1px solid #e5e7eb"
						--border-hover="1px solid #237bf8"
						--border-focused="1px solid #237bf8"
						--item-height="44px"
					/>
				</div>
			</div>

			<!-- 계좌번호 -->
			<div class="mt-5">
				<p class="text-[13px] text-gray-500">계좌번호</p>
				<input
					type="text"
					inputmode="numeric"
					value={form.account_number}
					oninput={on_account_input}
					placeholder="- 없이 숫자만 입력"
					class="mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 text-[15px] text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none"
				/>
			</div>

			<!-- 예금주 -->
			<div class="mt-5">
				<p class="text-[13px] text-gray-500">예금주</p>
				<input
					type="text"
					bind:value={form.account_holder}
					placeholder="예금주명 입력"
					class="mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 text-[15px] text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none"
				/>
			</div>

			<!-- 주민등록번호 / 사업자등록번호 -->
			{#if form.account_type === 'individual'}
				<div class="mt-5">
					<p class="text-[13px] text-gray-500">주민등록번호</p>
					<input
						type="text"
						inputmode="numeric"
						value={display_resident()}
						oninput={on_resident_input}
						placeholder="000000-0000000"
						class="mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 text-[15px] text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none"
					/>
					<p class="mt-2 text-[12px] text-gray-400">
						원천징수 신고를 위해 필요해요
					</p>
				</div>
			{:else}
				<div class="mt-5">
					<p class="text-[13px] text-gray-500">사업자등록번호</p>
					<input
						type="text"
						inputmode="numeric"
						value={display_business()}
						oninput={on_business_input}
						placeholder="000-00-00000"
						class="mt-2 w-full rounded-lg border border-gray-200 px-4 py-3 text-[15px] text-gray-900 placeholder-gray-400 focus:border-primary focus:outline-none"
					/>
				</div>
			{/if}

			<!-- 제출 버튼 -->
			<button
				onclick={handle_submit}
				disabled={!is_valid || submitting}
				class="btn btn-primary mt-6 w-full"
			>
				{submitting ? '등록 중...' : '등록하기'}
			</button>
		</div>
	</div>
</Modal>

<!-- 삭제 확인 모달 -->
<Modal bind:is_modal_open={show_delete_modal} modal_position="center">
	<div class="p-5">
		<p class="text-[16px] font-semibold text-gray-900">
			계좌를 삭제할까요?
		</p>

		<div class="mt-5 flex gap-2">
			<button
				onclick={() => (show_delete_modal = false)}
				class="flex-1 rounded-lg bg-gray-100 py-3 text-[14px] font-medium text-gray-700 active:bg-gray-200"
			>
				취소
			</button>
			<button
				onclick={confirm_delete}
				class="flex-1 rounded-lg bg-red-500 py-3 text-[14px] font-medium text-white active:bg-red-600"
			>
				삭제하기
			</button>
		</div>
	</div>
</Modal>
