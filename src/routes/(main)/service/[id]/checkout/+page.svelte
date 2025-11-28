<script>
	import colors from '$lib/config/colors';
	import {
		get_api_context,
		get_user_context,
	} from '$lib/contexts/app_context.svelte.js';
	import {
		check_login,
		comma,
		copy_to_clipboard,
		show_toast,
	} from '$lib/utils/common';
	import { smart_go_back } from '$lib/utils/navigation.js';
	import Select from 'svelte-select';
	import { goto } from '$app/navigation';
	import {
		RiAddLine,
		RiArrowLeftSLine,
		RiCheckLine,
		RiFileCopyLine,
	} from 'svelte-remixicon';

	import Header from '$lib/components/ui/Header.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import AddBankAccountModal from '$lib/components/AddBankAccountModal.svelte';

	import { update_global_store } from '$lib/store/global_store.js';

	const me = get_user_context();
	const api = get_api_context();

	let { data } = $props();
	let { service, quantity, selected_options, bank_accounts } = $state(data);

	// 스텝 관리 (1: 요청사항, 2: 연락처, 3: 계좌정보/최종확인)
	let step = $state(1);
	const TOTAL_STEPS = 3;

	// 뒤로가기 모달
	let show_back_modal = $state(false);

	// 계좌 추가 모달
	let show_add_account_modal = $state(false);

	// 계좌 추가 성공 핸들러
	const handle_account_added = (new_account) => {
		bank_accounts = [...bank_accounts, new_account];
		account_mode = 'saved';
		selected_account_id = new_account.id;
	};

	// 폼 데이터
	let form_data = $state({
		special_request: '',
		buyer_contact: '',
	});

	// 계좌 선택
	let account_mode = $state(bank_accounts.length > 0 ? 'saved' : 'new');
	let selected_account_id = $state(
		bank_accounts.find((a) => a.is_default)?.id || bank_accounts[0]?.id || null,
	);

	// 새 계좌 입력
	let new_account = $state({
		account_number: '',
		account_holder: '',
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

	// 쿠폰 관련
	let coupon_code = $state('');
	let applied_coupon = $state(null);
	let coupon_error = $state('');

	// 선택된 계좌 정보
	const selected_account = $derived(
		bank_accounts.find((a) => a.id === selected_account_id),
	);

	// 가격 계산
	const base_amount = service.price * quantity;
	const options_amount =
		selected_options.reduce((sum, opt) => sum + opt.price_add, 0) * quantity;
	const total = base_amount + options_amount;

	// 쿠폰 할인
	const discount_amount = $derived(
		applied_coupon ? api.coupons.calculate_discount(applied_coupon, total) : 0,
	);

	// 최종 금액
	const final_total = $derived(total - discount_amount);
	const commission = $derived(Math.floor(total * 0.05));

	// 입금 계좌 정보
	const deposit_info = {
		bank: '부산은행',
		number: '101-2094-2262-04',
		holder: '퓨처밴스 이상민',
	};

	// 스텝별 유효성 검사
	const is_step_valid = $derived.by(() => {
		switch (step) {
			case 1:
				return true; // 요청사항은 선택
			case 2:
				return form_data.buyer_contact.trim().length >= 5;
			case 3:
				// 저장된 계좌 선택 or 새 계좌 입력
				if (account_mode === 'saved') {
					return !!selected_account;
				} else {
					return (
						selected_bank &&
						new_account.account_number.length >= 10 &&
						new_account.account_holder.length >= 2
					);
				}
			default:
				return false;
		}
	});

	// 쿠폰 적용
	const apply_coupon = async () => {
		coupon_error = '';
		if (!coupon_code.trim()) {
			coupon_error = '쿠폰 코드를 입력해주세요.';
			return;
		}

		const coupon = await api.coupons.select_by_code(coupon_code.trim());
		if (!coupon) {
			coupon_error = '존재하지 않는 쿠폰입니다.';
			return;
		}

		const validation = await api.coupons.validate_coupon(
			coupon,
			me.id,
			'service_purchase',
			total,
		);

		if (!validation.valid) {
			coupon_error = validation.message;
			return;
		}

		applied_coupon = coupon;
		show_toast('success', '쿠폰이 적용되었습니다!');
	};

	const remove_coupon = () => {
		applied_coupon = null;
		coupon_code = '';
		coupon_error = '';
	};

	// 네비게이션
	const go_prev = () => {
		if (step === 1) {
			show_back_modal = true;
		} else {
			step -= 1;
		}
	};

	const go_next = async () => {
		if (step < TOTAL_STEPS) {
			step += 1;
		} else {
			await submit_order();
		}
	};

	// 주문 제출
	const submit_order = async () => {
		if (!check_login(me)) return;

		update_global_store('loading', true);
		try {
			// 계좌 정보 결정
			let bank_info;
			if (account_mode === 'saved' && selected_account) {
				bank_info = {
					bank: selected_account.bank,
					account_number: selected_account.account_number,
					depositor_name: selected_account.account_holder,
				};
			} else {
				bank_info = {
					bank: selected_bank?.value || '',
					account_number: new_account.account_number.replace(/[^0-9]/g, ''),
					depositor_name: new_account.account_holder,
				};
			}

			const order_data = {
				buyer_id: me.id,
				seller_id: service.users.id,
				service_id: service.id,
				service_title: service.title,
				quantity: quantity,
				unit_price: service.price,
				commission_amount: commission,
				total_with_commission: final_total,
				coupon_id: applied_coupon?.id || null,
				coupon_discount: discount_amount,
				depositor_name: bank_info.depositor_name,
				bank: bank_info.bank,
				account_number: bank_info.account_number,
				buyer_contact: form_data.buyer_contact.trim(),
				special_request: form_data.special_request.trim(),
			};

			const new_order = await api.service_orders.insert(order_data);

			// 쿠폰 사용 기록
			if (applied_coupon) {
				await api.user_coupons.insert({
					user_id: me.id,
					coupon_id: applied_coupon.id,
					order_id: new_order.id,
					discount_amount: discount_amount,
				});
				await api.coupons.increment_usage(applied_coupon.id);
			}

			// 선택된 옵션 저장
			if (selected_options.length > 0) {
				const order_options_data = selected_options.map((opt) => ({
					order_id: new_order.id,
					option_id: opt.id,
					option_name: opt.name,
					option_price: opt.price_add,
				}));
				await api.order_options.insert_bulk(order_options_data);
			}

			// 판매자에게 알림
			try {
				if (service?.users?.id && service.users.id !== me.id) {
					await api.notifications.insert({
						recipient_id: service.users.id,
						actor_id: me.id,
						type: 'order.created',
						resource_type: 'order',
						resource_id: String(new_order.id),
						payload: {
							service_id: service.id,
							service_title: service.title,
							total: total,
						},
						link_url: `/@${service.users.handle}/accounts/orders`,
					});
				}
			} catch (e) {
				console.error('Failed to insert notification:', e);
			}

			show_toast('success', '주문이 완료되었습니다!');
			goto(`/@${me.handle}/accounts/orders`, { replaceState: true });
		} catch (error) {
			console.error('주문 생성 실패:', error);
			show_toast('error', '주문에 실패했습니다. 다시 시도해주세요.');
		} finally {
			update_global_store('loading', false);
		}
	};
</script>

<svelte:head>
	<title>주문하기 | 문</title>
</svelte:head>

<Header>
	<button slot="left" onclick={go_prev}>
		<RiArrowLeftSLine size={24} color={colors.gray[600]} />
	</button>
	<h1 slot="center" class="font-semibold">주문하기</h1>
</Header>

<!-- Progress bar -->
<div class="px-4">
	<div class="h-1 w-full rounded-full bg-gray-200">
		<div
			class="h-1 rounded-lg bg-blue-600 transition-all duration-300"
			style="width: {(step / TOTAL_STEPS) * 100}%"
		></div>
	</div>
</div>

<main class="px-4 pb-28">
	<!-- Step 1: 요청사항 -->
	{#if step === 1}
		<div class="mt-6">
			<h2 class="text-[18px] font-semibold text-gray-900">
				요청사항이 있으신가요?
			</h2>
			<p class="mt-1 text-[14px] text-gray-500">
				작성하지 않아도 다음 단계로 넘어갈 수 있어요
			</p>

			<textarea
				bind:value={form_data.special_request}
				placeholder="예: 급하게 필요해서 빠른 진행 부탁드립니다"
				rows="5"
				class="mt-4 w-full resize-none rounded-xl border border-gray-200 p-4 text-[15px] text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none"
			></textarea>
		</div>

		<!-- Step 2: 연락처 -->
	{:else if step === 2}
		<div class="mt-6">
			<h2 class="text-[18px] font-semibold text-gray-900">
				연락받으실 정보를 알려주세요
			</h2>
			<p class="mt-1 text-[14px] text-gray-500">
				주문 관련 안내를 받으실 연락처예요
			</p>

			<input
				type="text"
				bind:value={form_data.buyer_contact}
				placeholder="전화번호 또는 카카오톡 ID"
				class="mt-4 w-full rounded-xl border border-gray-200 px-4 py-4 text-[15px] text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none"
			/>
		</div>

		<!-- Step 3: 계좌 정보 + 최종 확인 -->
	{:else if step === 3}
		<div class="mt-6">
			<h2 class="text-[18px] font-semibold text-gray-900">
				마지막으로 확인해주세요
			</h2>

			<!-- 주문 요약 -->
			<div class="mt-4 rounded-xl border border-gray-200 bg-white p-4">
				<p class="text-[13px] font-medium text-gray-500">주문 내용</p>
				<div class="mt-2 space-y-1.5">
					<div class="flex justify-between text-[14px]">
						<span class="text-gray-700">{service.title}</span>
						<span class="font-medium text-gray-900"
							>₩{comma(service.price)}</span
						>
					</div>

					{#if selected_options.length > 0}
						{#each selected_options as option (option.id)}
							<div class="flex justify-between text-[13px]">
								<span class="text-gray-500">+ {option.name}</span>
								<span class="text-gray-600">₩{comma(option.price_add)}</span>
							</div>
						{/each}
					{/if}

					{#if quantity > 1}
						<div class="flex justify-between text-[13px]">
							<span class="text-gray-500">수량</span>
							<span class="text-gray-600">{quantity}개</span>
						</div>
					{/if}

					{#if discount_amount > 0}
						<div class="flex justify-between text-[13px]">
							<span class="text-blue-600">쿠폰 할인</span>
							<span class="font-medium text-blue-600"
								>-₩{comma(discount_amount)}</span
							>
						</div>
					{/if}
				</div>

				<div class="mt-3 border-t border-gray-100 pt-3">
					<div class="flex justify-between">
						<span class="font-semibold text-gray-900">결제금액</span>
						<span class="text-[18px] font-bold text-gray-900"
							>₩{comma(final_total)}</span
						>
					</div>
				</div>
			</div>

			<!-- 쿠폰 -->
			<div class="mt-4 rounded-xl border border-gray-200 bg-white p-4">
				<p class="text-[13px] font-medium text-gray-500">쿠폰</p>
				{#if !applied_coupon}
					<div class="mt-2 flex gap-2">
						<input
							bind:value={coupon_code}
							type="text"
							placeholder="쿠폰 코드"
							class="flex-1 rounded-lg border border-gray-200 px-3 py-2.5 text-[14px] focus:border-blue-500 focus:outline-none"
							onkeydown={(e) => e.key === 'Enter' && apply_coupon()}
						/>
						<button
							onclick={apply_coupon}
							class="rounded-lg bg-gray-100 px-4 py-2.5 text-[14px] font-medium text-gray-700 active:bg-gray-200"
						>
							적용
						</button>
					</div>
					{#if coupon_error}
						<p class="mt-2 text-[13px] text-red-500">{coupon_error}</p>
					{/if}
				{:else}
					<div
						class="mt-2 flex items-center justify-between rounded-lg bg-blue-50 p-3"
					>
						<div>
							<p class="text-[14px] font-medium text-blue-900">
								{applied_coupon.name}
							</p>
							<p class="text-[13px] text-blue-700">
								-₩{comma(discount_amount)} 할인
							</p>
						</div>
						<button
							onclick={remove_coupon}
							class="text-[13px] font-medium text-blue-600"
						>
							취소
						</button>
					</div>
				{/if}
			</div>

			<!-- 입금 계좌 안내 -->
			<div class="mt-4 rounded-xl border border-gray-200 bg-gray-50 p-4">
				<p class="text-[13px] font-medium text-gray-500">입금 계좌</p>
				<div class="mt-2 flex items-center justify-between">
					<div>
						<p class="text-[15px] font-semibold text-gray-900">
							{deposit_info.bank}
							{deposit_info.number}
						</p>
						<p class="text-[13px] text-gray-500">{deposit_info.holder}</p>
					</div>
					<button
						onclick={() =>
							copy_to_clipboard(
								deposit_info.number,
								'계좌번호가 복사되었습니다.',
							)}
						class="flex h-9 w-9 items-center justify-center rounded-full bg-white active:bg-gray-100"
					>
						<RiFileCopyLine size={18} class="text-gray-500" />
					</button>
				</div>
			</div>

			<!-- 계좌 정보 입력 -->
			<div class="mt-4 rounded-xl border border-gray-200 bg-white p-4">
				<p class="text-[13px] font-medium text-gray-500">내 계좌 정보</p>

				{#if bank_accounts.length > 0}
					<div class="mt-3 space-y-2">
						{#each bank_accounts as account (account.id)}
							<button
								onclick={() => {
									account_mode = 'saved';
									selected_account_id = account.id;
								}}
								class="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition
									{account_mode === 'saved' && selected_account_id === account.id
									? 'border-blue-500 bg-blue-50'
									: 'border-gray-200 hover:bg-gray-50'}"
							>
								<div
									class="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2
										{account_mode === 'saved' && selected_account_id === account.id
										? 'border-blue-500 bg-blue-500'
										: 'border-gray-300'}"
								>
									{#if account_mode === 'saved' && selected_account_id === account.id}
										<RiCheckLine size={12} class="text-white" />
									{/if}
								</div>
								<div class="min-w-0 flex-1">
									<p class="truncate text-[14px] font-medium text-gray-900">
										{account.bank}
										{account.account_number}
									</p>
									<p class="text-[12px] text-gray-500">
										{account.account_holder}
									</p>
								</div>
							</button>
						{/each}

						<button
							onclick={() => (account_mode = 'new')}
							class="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition
								{account_mode === 'new'
								? 'border-blue-500 bg-blue-50'
								: 'border-gray-200 hover:bg-gray-50'}"
						>
							<div
								class="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2
									{account_mode === 'new' ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}"
							>
								{#if account_mode === 'new'}
									<RiCheckLine size={12} class="text-white" />
								{/if}
							</div>
							<div class="flex items-center gap-1.5">
								<RiAddLine size={16} class="text-gray-500" />
								<span class="text-[14px] text-gray-600">다른 계좌 입력</span>
							</div>
						</button>
					</div>

					{#if account_mode === 'new'}
						<div class="mt-3 space-y-3 border-t border-gray-100 pt-3">
							<div>
								<Select
									items={bank_items}
									bind:value={selected_bank}
									placeholder="은행 선택"
									--border-radius="0.75rem"
									--padding="0 1rem"
									--height="48px"
									--font-size="15px"
									--border="1px solid #e5e7eb"
									--border-hover="1px solid #3b82f6"
									--border-focused="1px solid #3b82f6"
									--item-height="44px"
								/>
							</div>
							<input
								type="text"
								inputmode="numeric"
								bind:value={new_account.account_number}
								placeholder="계좌번호 (- 없이 숫자만)"
								class="w-full rounded-xl border border-gray-200 px-4 py-3.5 text-[15px] placeholder-gray-400 focus:border-blue-500 focus:outline-none"
							/>
							<input
								type="text"
								bind:value={new_account.account_holder}
								placeholder="예금주명"
								class="w-full rounded-xl border border-gray-200 px-4 py-3.5 text-[15px] placeholder-gray-400 focus:border-blue-500 focus:outline-none"
							/>
						</div>
					{/if}
				{:else}
					<!-- 계좌가 없을 때 -->
					<button
						onclick={() => (show_add_account_modal = true)}
						class="mt-3 flex w-full flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-6 text-center hover:bg-gray-50"
					>
						<div
							class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50"
						>
							<RiAddLine size={20} class="text-blue-500" />
						</div>
						<p class="mt-2 text-[14px] font-medium text-gray-600">
							계좌 정보 추가
						</p>
					</button>
				{/if}
			</div>
		</div>
	{/if}
</main>

<!-- 하단 버튼 -->
<div class="fixed bottom-0 w-full max-w-screen-md bg-white p-4">
	<div class="pb-safe">
		<button
			onclick={go_next}
			disabled={!is_step_valid}
			class="btn btn-primary w-full"
		>
			{#if step === TOTAL_STEPS}
				₩{comma(final_total)} 결제하기
			{:else}
				다음
			{/if}
		</button>
	</div>
</div>

<!-- 뒤로가기 모달 -->
<Modal bind:is_modal_open={show_back_modal} modal_position="center">
	<div class="p-5">
		<p class="text-[16px] font-semibold text-gray-900">
			주문하지 않고 나갈까요?
		</p>

		<div class="mt-5 flex gap-2">
			<button
				onclick={smart_go_back}
				class="flex-1 rounded-lg bg-gray-100 py-3 text-[14px] font-medium text-gray-700 active:bg-gray-200"
			>
				나가기
			</button>
			<button
				onclick={() => (show_back_modal = false)}
				class="flex-1 rounded-lg bg-blue-500 py-3 text-[14px] font-medium text-white active:bg-blue-600"
			>
				계속하기
			</button>
		</div>
	</div>
</Modal>

<!-- 계좌 추가 모달 -->
<AddBankAccountModal
	bind:is_modal_open={show_add_account_modal}
	onSuccess={handle_account_added}
/>
