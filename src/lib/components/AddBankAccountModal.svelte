<script>
	import Select from 'svelte-select';
	import Modal from '$lib/components/ui/Modal.svelte';
	import { get_api_context, get_user_context } from '$lib/contexts/app_context.svelte.js';
	import { show_toast } from '$lib/utils/common';

	let { is_modal_open = $bindable(false), onSuccess } = $props();

	const me = get_user_context();
	const api = get_api_context();

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
	let form = $state({
		account_type: 'individual',
		account_number: '',
		account_holder: '',
		resident_number: '',
		business_number: '',
	});
	let submitting = $state(false);

	// 유효성 검사
	const is_valid = $derived(
		selected_bank &&
			form.account_number.length >= 10 &&
			form.account_holder.length >= 2 &&
			(form.account_type === 'individual'
				? form.resident_number.length === 13
				: form.business_number.length === 10),
	);

	// 계좌번호 입력 핸들러
	const on_account_input = (e) => {
		form.account_number = e.target.value.replace(/[^0-9]/g, '');
	};

	// 주민번호 입력 핸들러
	const on_resident_input = (e) => {
		form.resident_number = e.target.value.replace(/[^0-9]/g, '').slice(0, 13);
	};

	// 사업자번호 입력 핸들러
	const on_business_input = (e) => {
		form.business_number = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
	};

	// 주민번호 표시 포맷
	const display_resident = () => {
		const num = form.resident_number;
		if (num.length <= 6) return num;
		return `${num.slice(0, 6)}-${num.slice(6)}`;
	};

	// 사업자번호 표시 포맷
	const display_business = () => {
		const num = form.business_number;
		if (num.length <= 3) return num;
		if (num.length <= 5) return `${num.slice(0, 3)}-${num.slice(3)}`;
		return `${num.slice(0, 3)}-${num.slice(3, 5)}-${num.slice(5)}`;
	};

	// 폼 초기화
	const reset_form = () => {
		selected_bank = null;
		form = {
			account_type: 'individual',
			account_number: '',
			account_holder: '',
			resident_number: '',
			business_number: '',
		};
	};

	// 제출
	const handle_submit = async () => {
		if (!is_valid || submitting) return;

		submitting = true;
		try {
			const new_account = await api.user_bank_accounts.insert({
				user_id: me.id,
				bank: selected_bank.value,
				account_number: form.account_number,
				account_holder: form.account_holder,
				account_type: form.account_type,
				resident_number:
					form.account_type === 'individual' ? form.resident_number : null,
				business_number:
					form.account_type === 'business' ? form.business_number : null,
			});

			show_toast('success', '계좌가 등록되었습니다.');
			is_modal_open = false;
			reset_form();
			onSuccess?.(new_account);
		} catch (error) {
			console.error('계좌 등록 실패:', error);
			show_toast('error', '계좌 등록에 실패했습니다.');
		} finally {
			submitting = false;
		}
	};
</script>

<Modal bind:is_modal_open modal_position="bottom">
	<div class="flex flex-col items-center p-4">
		<div class="h-1 w-10 self-center rounded-full bg-gray-300"></div>

		<h3 class="mt-4 text-[17px] font-semibold">계좌 등록</h3>

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
