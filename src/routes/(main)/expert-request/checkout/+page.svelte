<script>
	import colors from '$lib/config/colors';
	import {
		get_api_context,
		get_user_context,
	} from '$lib/contexts/app-context.svelte.js';
	import {
		check_login,
		comma,
		copy_to_clipboard,
		show_toast,
	} from '$lib/utils/common';
	import { goto } from '$app/navigation';
	import { RiArrowLeftSLine } from 'svelte-remixicon';

	import Header from '$lib/components/ui/Header.svelte';

	import { update_global_store } from '$lib/store/global_store.js';

	const { me } = get_user_context();
	const { api } = get_api_context();

	let { data } = $props();
	let { request } = $state(data);

	const REGISTRATION_FEE = 4900;

	// 폼 데이터
	let form_data = $state({
		depositor_name: '',
		bank: '',
		account_number: '',
	});

	// 쿠폰 관련
	let coupon_code = $state('');
	let applied_coupon = $state(null);
	let coupon_error = $state('');

	// 쿠폰 할인 금액 계산
	const discount_amount = $derived(
		applied_coupon
			? api.coupons.calculate_discount(applied_coupon, REGISTRATION_FEE)
			: 0,
	);

	// 최종 결제 금액 (쿠폰 적용 후)
	const final_fee = $derived(REGISTRATION_FEE - discount_amount);

	// 폼 유효성
	const is_form_valid = $derived(
		form_data.depositor_name.trim() &&
			form_data.bank.trim() &&
			form_data.account_number.trim(),
	);

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
			'job_registration',
			REGISTRATION_FEE,
		);

		if (!validation.valid) {
			coupon_error = validation.message;
			return;
		}

		applied_coupon = coupon;
		show_toast('success', '쿠폰이 적용되었습니다!');
	};

	// 쿠폰 제거
	const remove_coupon = () => {
		applied_coupon = null;
		coupon_code = '';
		coupon_error = '';
	};

	// 결제 제출
	const submit_payment = async () => {
		if (!check_login(me) || !is_form_valid) return;

		update_global_store('loading', true);
		try {
			// 결제 완료 처리 (쿠폰 적용)
			await api.expert_requests.complete_registration_payment(
				request.id,
				{
					depositor_name: form_data.depositor_name.trim(),
					bank: form_data.bank.trim(),
					account_number: form_data.account_number.trim(),
				},
				applied_coupon
					? {
							coupon_id: applied_coupon.id,
							coupon_discount: discount_amount,
						}
					: null,
			);

			// 쿠폰 사용 기록
			if (applied_coupon) {
				await api.user_coupons.insert({
					user_id: me.id,
					coupon_id: applied_coupon.id,
					expert_request_id: request.id,
					discount_amount: discount_amount,
				});

				await api.coupons.increment_usage(applied_coupon.id);
			}

			show_toast(
				'success',
				'입금 정보가 제출되었습니다. 관리자 승인 후 공고가 게시됩니다.',
			);
			goto(`/expert-request/${request.id}`, { replaceState: true });
		} catch (error) {
			console.error('결제 처리 실패:', error);
			show_toast('error', '결제 처리에 실패했습니다. 다시 시도해주세요.');
		} finally {
			update_global_store('loading', false);
		}
	};
</script>

<svelte:head>
	<title>공고 등록 결제 | 문</title>
</svelte:head>

<Header>
	<button slot="left" onclick={() => goto(`/regi/expert-request`)}>
		<RiArrowLeftSLine size={26} color={colors.gray[600]} />
	</button>
	<h1 slot="center" class="font-semibold">공고 등록 결제</h1>
</Header>

<main class="mx-4 pb-24">
	<!-- 공고 정보 -->
	<div class="mt-4 rounded-lg border border-gray-200 bg-white p-4">
		<h2 class="mb-3 text-base font-semibold text-gray-900">등록할 공고</h2>

		<div class="space-y-2">
			<div>
				<p class="text-sm text-gray-600">제목</p>
				<p class="mt-1 font-medium text-gray-900">{request.title}</p>
			</div>

			{#if request.category}
				<div>
					<p class="text-sm text-gray-600">카테고리</p>
					<p class="mt-1 font-medium text-gray-900">{request.category}</p>
				</div>
			{/if}

			<div>
				<p class="text-sm text-gray-600">보상금</p>
				<p class="mt-1 font-medium text-gray-900">
					₩{comma(request.reward_amount)}
				</p>
			</div>
		</div>
	</div>

	<!-- 등록비 안내 -->
	<div class="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4">
		<h3 class="mb-2 text-sm font-semibold text-blue-900">공고 등록 안내</h3>
		<ul class="space-y-1 text-xs text-blue-700">
			<li>• 공고 등록 시 {comma(REGISTRATION_FEE)}원의 등록비가 발생합니다.</li>
			<li>• 등록비 결제 완료 후 공고가 게시됩니다.</li>
			<li>• 마음에 드는 전문가를 선택하여 프로젝트를 진행하세요.</li>
		</ul>
	</div>

	<!-- 입금 계좌 안내 -->
	<div class="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
		<h3 class="mb-3 text-sm font-semibold text-gray-900">입금 계좌 안내</h3>
		<div class="space-y-2 text-sm">
			<div class="flex items-center justify-between">
				<div class="flex items-center">
					<span class="w-16 text-gray-600">은행</span>
					<span class="font-medium text-gray-900">부산은행</span>
				</div>
			</div>
			<div class="flex items-center justify-between">
				<div class="flex items-center">
					<span class="w-16 text-gray-600">예금주</span>
					<span class="font-medium text-gray-900">퓨처밴스 이상민</span>
				</div>
			</div>
			<div class="flex items-center justify-between">
				<div class="flex items-center">
					<span class="w-16 text-gray-600">계좌번호</span>
					<span class="text-primary font-medium">101-2094-2262-04</span>
				</div>
				<button
					onclick={() => {
						copy_to_clipboard('101-2094-2262-04', '계좌번호가 복사되었습니다.');
					}}
					class="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100"
				>
					복사
				</button>
			</div>
			<div class="space-y-2 border-t border-gray-200 pt-2">
				<div class="flex items-center justify-between text-sm">
					<span class="text-gray-600">등록비</span>
					<span class="font-medium text-gray-900"
						>₩{comma(REGISTRATION_FEE)}</span
					>
				</div>

				{#if discount_amount > 0}
					<div class="flex items-center justify-between text-sm">
						<span class="text-blue-600">쿠폰 할인</span>
						<span class="font-medium text-blue-600"
							>-₩{comma(discount_amount)}</span
						>
					</div>
					<div class="h-px bg-gray-200"></div>
				{/if}

				<div class="flex items-center justify-between">
					<span class="font-semibold text-gray-900">최종 입금 금액</span>
					<span class="text-lg font-bold text-blue-600"
						>₩{comma(final_fee)}</span
					>
				</div>
			</div>
		</div>
	</div>

	<!-- 쿠폰 입력 -->
	<div class="mt-4 rounded-lg border border-gray-200 bg-white p-4">
		<h3 class="mb-3 text-sm font-semibold text-gray-900">쿠폰</h3>

		{#if !applied_coupon}
			<div class="flex gap-2">
				<input
					bind:value={coupon_code}
					type="text"
					placeholder="쿠폰 코드 입력"
					class="input input-bordered h-11 flex-1 focus:border-gray-400 focus:outline-none"
					onkeydown={(e) => e.key === 'Enter' && apply_coupon()}
				/>
				<button
					onclick={apply_coupon}
					class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
				>
					적용
				</button>
			</div>
			{#if coupon_error}
				<p class="mt-2 text-sm text-red-600">{coupon_error}</p>
			{/if}
		{:else}
			<div class="flex items-center justify-between rounded-lg bg-blue-50 p-3">
				<div class="flex-1">
					<p class="font-medium text-blue-900">{applied_coupon.name}</p>
					<p class="text-sm text-blue-700">
						{#if discount_amount >= REGISTRATION_FEE}
							무료 등록
						{:else}
							-₩{comma(discount_amount)} 할인
						{/if}
					</p>
				</div>
				<button
					onclick={remove_coupon}
					class="ml-3 text-sm font-medium text-blue-600 hover:text-blue-800"
				>
					취소
				</button>
			</div>
		{/if}
	</div>

	<!-- 입금 정보 입력 -->
	<div class="mt-6">
		<h2 class="mb-4 text-base font-semibold text-gray-900">입금 정보</h2>

		<div class="space-y-4">
			<div>
				<label class="mb-2 block text-sm font-medium text-gray-700">
					입금자명
				</label>
				<input
					bind:value={form_data.depositor_name}
					type="text"
					placeholder="입금자명을 입력해주세요"
					class="input input-bordered h-12 w-full focus:border-gray-400 focus:outline-none"
				/>
			</div>

			<div>
				<label class="mb-2 block text-sm font-medium text-gray-700">
					은행
				</label>
				<input
					bind:value={form_data.bank}
					type="text"
					placeholder="은행명을 입력해주세요"
					class="input input-bordered h-12 w-full focus:border-gray-400 focus:outline-none"
				/>
			</div>

			<div>
				<label class="mb-2 block text-sm font-medium text-gray-700">
					계좌번호
				</label>
				<input
					bind:value={form_data.account_number}
					type="text"
					placeholder="계좌번호를 입력해주세요"
					class="input input-bordered h-12 w-full focus:border-gray-400 focus:outline-none"
				/>
			</div>
		</div>
	</div>
</main>

<!-- 하단 고정 버튼 -->
<div
	class="fixed bottom-0 w-full max-w-screen-md border-gray-200 bg-white px-4 py-3"
>
	<div class="pb-safe">
		<button
			onclick={submit_payment}
			disabled={!is_form_valid}
			class="btn btn-primary h-12 w-full rounded-lg text-base font-medium disabled:cursor-not-allowed disabled:opacity-50"
		>
			{#if final_fee === 0}
				무료로 등록하기
			{:else}
				₩{comma(final_fee)} 결제하고 등록하기
			{/if}
		</button>
	</div>
</div>
