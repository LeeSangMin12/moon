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
	let { service, quantity, selected_options } = $state(data);

	// 폼 데이터
	let form_data = $state({
		depositor_name: '',
		bank: '',
		account_number: '',
		buyer_contact: '',
		special_request: '',
	});

	// 쿠폰 관련
	let coupon_code = $state('');
	let applied_coupon = $state(null);
	let coupon_error = $state('');

	// 가격 계산 (판매자 부담 방식)
	const base_amount = service.price * quantity;
	const options_amount =
		selected_options.reduce((sum, opt) => sum + opt.price_add, 0) * quantity;
	const total = base_amount + options_amount; // 구매자는 표시가격 그대로 지불

	// 쿠폰 할인 금액 계산
	const discount_amount = $derived(
		applied_coupon ? api.coupons.calculate_discount(applied_coupon, total) : 0,
	);

	// 최종 결제 금액 (쿠폰 적용 후)
	const final_total = $derived(total - discount_amount);
	const commission = $derived(Math.floor(total * 0.05)); // 판매자에게서 차감될 수수료 (5%) - 원래 가격 기준, 쿠폰은 플랫폼 부담

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

	// 쿠폰 제거
	const remove_coupon = () => {
		applied_coupon = null;
		coupon_code = '';
		coupon_error = '';
	};

	// 폼 유효성
	const is_form_valid = $derived(
		form_data.depositor_name.trim() &&
			form_data.bank.trim() &&
			form_data.account_number.trim() &&
			form_data.buyer_contact.trim(),
	);

	// 주문 제출
	const submit_order = async () => {
		if (!check_login(me) || !is_form_valid) return;

		update_global_store('loading', true);
		try {
			// 주문 생성 (쿠폰 적용)
			// - 구매자는 final_total(쿠폰 적용 후 금액) 지불
			// - 판매자는 (total - commission) 수령 (원래 가격 - 수수료)
			// - 플랫폼은 commission 수익, 쿠폰 할인은 플랫폼이 부담
			const order_data = {
				buyer_id: me.id,
				seller_id: service.users.id,
				service_id: service.id,
				service_title: service.title,
				quantity: quantity,
				unit_price: service.price, // 기본 단가
				commission_amount: commission, // 판매자에게서 차감될 수수료
				total_with_commission: final_total, // 구매자 지불 금액 (쿠폰 적용 후)
				coupon_id: applied_coupon?.id || null,
				coupon_discount: discount_amount,
				depositor_name: form_data.depositor_name.trim(),
				bank: form_data.bank.trim(),
				account_number: form_data.account_number.trim(),
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

			show_toast('success', '주문이 성공적으로 접수되었습니다!');
			goto(`/@${me.handle}/accounts/orders`);
		} catch (error) {
			console.error('주문 생성 실패:', error);
			show_toast('error', '주문 접수에 실패했습니다. 다시 시도해주세요.');
		} finally {
			update_global_store('loading', false);
		}
	};
</script>

<svelte:head>
	<title>주문하기 | 문</title>
</svelte:head>

<Header>
	<button
		slot="left"
		onclick={() => goto(`/service/${service.id}`, { replaceState: true })}
	>
		<RiArrowLeftSLine size={26} color={colors.gray[600]} />
	</button>
	<h1 slot="center" class="font-semibold">주문하기</h1>
</Header>

<main class="mx-4 pb-24">
	<!-- 주문 요약 -->
	<div class="mt-4 rounded-lg border border-gray-200 bg-white p-4">
		<h2 class="mb-3 text-base font-semibold text-gray-900">주문 내용</h2>

		<div class="space-y-2 text-sm">
			<div class="flex justify-between">
				<span class="text-gray-600">{service.title}</span>
				<span class="font-medium">₩{comma(service.price)}</span>
			</div>

			{#if selected_options.length > 0}
				{#each selected_options as option}
					<div class="flex justify-between pl-3">
						<span class="text-gray-500">+ {option.name}</span>
						<span class="text-gray-700">₩{comma(option.price_add)}</span>
					</div>
				{/each}
			{/if}

			<div class="flex justify-between">
				<span class="text-gray-600">수량</span>
				<span class="font-medium">{quantity}개</span>
			</div>

			<div class="my-3 h-px bg-gray-200"></div>

			<div class="flex justify-between text-sm">
				<span class="text-gray-600">소계</span>
				<span class="font-medium text-gray-900">₩{comma(total)}</span>
			</div>

			{#if discount_amount > 0}
				<div class="flex justify-between text-sm">
					<span class="text-blue-600">쿠폰 할인</span>
					<span class="font-medium text-blue-600"
						>-₩{comma(discount_amount)}</span
					>
				</div>
			{/if}

			<div class="my-2 h-px bg-gray-200"></div>

			<div class="flex justify-between text-base">
				<span class="font-semibold text-gray-900">최종 결제금액</span>
				<span class="text-xl font-bold text-blue-600"
					>₩{comma(final_total)}</span
				>
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
					<p class="text-sm text-blue-700">-₩{comma(discount_amount)} 할인</p>
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
		</div>
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

			<div>
				<label class="mb-2 block text-sm font-medium text-gray-700">
					연락처
				</label>
				<input
					bind:value={form_data.buyer_contact}
					type="text"
					placeholder="전화번호 또는 카카오톡 ID"
					class="input input-bordered h-12 w-full focus:border-gray-400 focus:outline-none"
				/>
			</div>

			<div>
				<label class="mb-2 block text-sm font-medium text-gray-700">
					특별 요청사항 (선택)
				</label>
				<textarea
					bind:value={form_data.special_request}
					placeholder="추가로 요청하실 내용이 있으면 입력해주세요"
					rows="3"
					class="textarea textarea-bordered w-full resize-none focus:border-gray-400 focus:outline-none"
				></textarea>
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
			onclick={submit_order}
			disabled={!is_form_valid}
			class="btn btn-primary h-12 w-full rounded-lg text-base font-medium disabled:cursor-not-allowed disabled:opacity-50"
		>
			₩{comma(final_total)} 주문하기
		</button>
	</div>
</div>
