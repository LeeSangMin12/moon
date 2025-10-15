<script>
	import colors from '$lib/config/colors';
	import {
		get_api_context,
		get_user_context,
	} from '$lib/contexts/app-context.svelte.js';
	import { comma, show_toast } from '$lib/utils/common';
	import { goto } from '$app/navigation';
	import { RiArrowLeftSLine } from 'svelte-remixicon';

	import Header from '$lib/components/ui/Header.svelte';

	const { me } = get_user_context();
	const { api } = get_api_context();

	let { data } = $props();
	let { order, order_options, is_buyer, is_seller } = $state(data);

	// 주문 상태 한글 변환
	const get_status_text = (status) => {
		const status_map = {
			pending: '결제 대기',
			paid: '결제 완료',
			completed: '서비스 완료',
			cancelled: '주문 취소',
			refunded: '환불 완료',
		};
		return status_map[status] || status;
	};

	// 주문 상태별 색상
	const get_status_color = (status) => {
		const color_map = {
			pending: 'bg-yellow-100 text-yellow-800',
			paid: 'bg-blue-100 text-blue-800',
			completed: 'bg-green-100 text-green-800',
			cancelled: 'bg-red-100 text-red-800',
			refunded: 'bg-gray-100 text-gray-800',
		};
		return color_map[status] || 'bg-gray-100 text-gray-800';
	};

	// 날짜 포맷팅 함수
	const format_date = (date_string) => {
		return new Date(date_string).toLocaleDateString('ko-KR', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});
	};

	// 주문 승인 (판매자용)
	const handle_approve_order = async () => {
		try {
			await api.service_orders.approve(order.id);
			show_toast('success', '주문이 승인되었습니다.');

			// 구매자에게 알림
			try {
				if (order.buyer?.id) {
					await api.notifications.insert({
						recipient_id: order.buyer.id,
						actor_id: me.id,
						type: 'order.approved',
						resource_type: 'order',
						resource_id: String(order.id),
						payload: { service_title: order.service_title, status: 'paid' },
						link_url: `/@${order.buyer.handle}/accounts/orders/${order.id}`,
					});
				}
			} catch (e) {
				console.error('Failed to insert notification (order.approved):', e);
			}

			// 주문 상태 업데이트
			order.status = 'paid';
		} catch (error) {
			console.error('주문 승인 실패:', error);
			show_toast('error', '주문 승인에 실패했습니다.');
		}
	};

	// 주문 완료 (판매자용)
	const handle_complete_order = async () => {
		try {
			await api.service_orders.complete(order.id);
			show_toast('success', '서비스가 완료되었습니다.');

			// 구매자에게 알림
			try {
				if (order.buyer?.id) {
					await api.notifications.insert({
						recipient_id: order.buyer.id,
						actor_id: me.id,
						type: 'order.completed',
						resource_type: 'order',
						resource_id: String(order.id),
						payload: {
							service_title: order.service_title,
							status: 'completed',
						},
						link_url: `/@${order.buyer.handle}/accounts/orders/${order.id}`,
					});
				}
			} catch (e) {
				console.error('Failed to insert notification (order.completed):', e);
			}

			// 주문 상태 업데이트
			order.status = 'completed';
		} catch (error) {
			console.error('주문 완료 실패:', error);
			show_toast('error', '주문 완료에 실패했습니다.');
		}
	};

	// 주문 취소
	const handle_cancel_order = async () => {
		const reason = prompt('취소 사유를 입력해주세요.');
		if (!reason) return;

		try {
			await api.service_orders.cancel(order.id, reason);
			show_toast('success', '주문이 취소되었습니다.');

			// 상대방에게 알림
			try {
				const recipient_id = is_buyer ? order.seller.id : order.buyer.id;
				const recipient_handle = is_buyer
					? order.seller.handle
					: order.buyer.handle;

				if (recipient_id) {
					await api.notifications.insert({
						recipient_id: recipient_id,
						actor_id: me.id,
						type: 'order.cancelled',
						resource_type: 'order',
						resource_id: String(order.id),
						payload: {
							service_title: order.service_title,
							status: 'cancelled',
						},
						link_url: `/@${recipient_handle}/accounts/orders/${order.id}`,
					});
				}
			} catch (e) {
				console.error('Failed to insert notification (order.cancelled):', e);
			}

			// 주문 상태 업데이트
			order.status = 'cancelled';
		} catch (error) {
			console.error('주문 취소 실패:', error);
			show_toast('error', '주문 취소에 실패했습니다.');
		}
	};
</script>

<svelte:head>
	<title>주문 상세 | 문</title>
</svelte:head>

<Header>
	<button slot="left" onclick={() => history.back()}>
		<RiArrowLeftSLine size={24} color={colors.gray[600]} />
	</button>
	<h1 slot="center" class="font-semibold">주문 상세</h1>
</Header>

<main class="mx-4 pb-24">
	<!-- 상태 배지 -->
	<div class="mb-4 mt-4">
		<span
			class="inline-block rounded-full px-3 py-1 text-sm font-semibold {get_status_color(
				order.status,
			)}"
		>
			{get_status_text(order.status)}
		</span>
	</div>

	<!-- 서비스 정보 -->
	<div class="mb-6">
		<h2 class="mb-2 text-2xl font-bold text-gray-900">{order.service_title}</h2>
		<p class="text-sm text-gray-500">
			{#if is_buyer}
				판매자: @{order.seller.handle}
			{:else}
				구매자: @{order.buyer.handle}
			{/if}
		</p>
		<p class="text-sm text-gray-500">{format_date(order.created_at)}</p>
	</div>

	<!-- 금액 정보 -->
	<div class="mb-6 rounded-xl border border-gray-200 bg-white p-5">
		<h3 class="mb-4 text-base font-semibold text-gray-900">금액 정보</h3>

		{#if is_seller}
			<!-- 판매자: 정산 금액 표시 -->
			<div class="space-y-2 text-sm">
				<div class="flex justify-between">
					<span class="text-gray-600">구매자 지불</span>
					<span class="font-medium text-gray-900"
						>₩{comma(order.total_with_commission)}</span
					>
				</div>
				<div class="flex justify-between">
					<span class="text-gray-600">플랫폼 수수료 (5%)</span>
					<span class="text-red-600">-₩{comma(order.commission_amount)}</span>
				</div>
				<div
					class="flex justify-between border-t border-gray-200 pt-3 text-base"
				>
					<span class="font-semibold text-gray-900">정산 금액</span>
					<span class="text-2xl font-bold text-gray-900">
						₩{comma(order.total_with_commission - order.commission_amount)}
					</span>
				</div>
			</div>
		{:else}
			<!-- 구매자: 결제 금액만 표시 -->
			<div class="flex items-baseline justify-between">
				<span class="text-sm text-gray-600">결제 금액</span>
				<span class="text-2xl font-bold text-gray-900"
					>₩{comma(order.total_with_commission)}</span
				>
			</div>
		{/if}
	</div>

	<!-- 주문 상세 -->
	<div class="mb-6 rounded-xl border border-gray-200 bg-white p-5">
		<h3 class="mb-4 text-base font-semibold text-gray-900">주문 상세</h3>

		<div class="space-y-2 text-sm">
			<div class="flex justify-between">
				<span class="text-gray-600">서비스 단가</span>
				<span class="font-medium text-gray-900"
					>₩{comma(order.unit_price)}</span
				>
			</div>
			<div class="flex justify-between">
				<span class="text-gray-600">수량</span>
				<span class="font-medium text-gray-900">{order.quantity}개</span>
			</div>

			{#if order_options.length > 0}
				<div class="mt-3 border-t border-gray-100 pt-3">
					<p class="mb-2 text-xs font-semibold text-gray-600">선택된 옵션</p>
					{#each order_options as option}
						<div class="flex justify-between text-sm">
							<span class="text-gray-700">· {option.option_name}</span>
							<span class="text-gray-700">+₩{comma(option.option_price)}</span>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	<!-- 입금 정보 -->
	<div class="mb-6 rounded-xl border border-gray-200 bg-white p-5">
		<h3 class="mb-4 text-base font-semibold text-gray-900">입금 정보</h3>

		<div class="space-y-2 text-sm">
			<div class="flex justify-between">
				<span class="text-gray-600">입금자명</span>
				<span class="font-medium text-gray-900">{order.depositor_name}</span>
			</div>
			<div class="flex justify-between">
				<span class="text-gray-600">은행</span>
				<span class="font-medium text-gray-900">{order.bank}</span>
			</div>
			<div class="flex justify-between">
				<span class="text-gray-600">계좌번호</span>
				<span class="font-medium text-gray-900">{order.account_number}</span>
			</div>
			{#if order.buyer_contact}
				<div class="flex justify-between">
					<span class="text-gray-600">연락처</span>
					<span class="font-medium text-gray-900">{order.buyer_contact}</span>
				</div>
			{/if}
		</div>
	</div>

	<!-- 요청사항 -->
	{#if order.special_request}
		<div class="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-5">
			<h3 class="mb-2 text-sm font-semibold text-amber-900">
				{is_seller ? '구매자 요청사항' : '요청사항'}
			</h3>
			<p class="text-sm text-amber-800">{order.special_request}</p>
		</div>
	{/if}
</main>

<!-- 하단 고정 버튼 -->
<div class="fixed bottom-0 w-full max-w-screen-md border-t border-gray-200 bg-white px-4 py-3">
	<div class="pb-safe flex gap-2">
		{#if is_seller}
			{#if order.status === 'pending'}
				<button
					onclick={handle_approve_order}
					class="flex-1 rounded-lg bg-gray-900 px-4 py-3 text-sm font-semibold text-white hover:bg-gray-800"
				>
					결제 승인
				</button>
				<button
					onclick={handle_cancel_order}
					class="rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
				>
					취소
				</button>
			{:else if order.status === 'paid'}
				<button
					onclick={handle_complete_order}
					class="flex-1 rounded-lg bg-gray-900 px-4 py-3 text-sm font-semibold text-white hover:bg-gray-800"
				>
					서비스 완료
				</button>
				<button
					onclick={handle_cancel_order}
					class="rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
				>
					취소
				</button>
			{:else}
				<button
					onclick={() => goto(`/service/${order.service_id}`)}
					class="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
				>
					서비스 보기
				</button>
			{/if}
		{:else}
			<!-- 구매자 -->
			<button
				onclick={() => goto(`/service/${order.service_id}`)}
				class="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50"
			>
				서비스 보기
			</button>

			{#if order.status === 'pending'}
				<button
					onclick={handle_cancel_order}
					class="rounded-lg border border-red-300 bg-white px-4 py-3 text-sm font-semibold text-red-600 hover:bg-red-50"
				>
					주문 취소
				</button>
			{/if}

			{#if order.status === 'completed'}
				<button
					onclick={() => goto(`/service/${order.service_id}#reviews`)}
					class="flex-1 rounded-lg bg-gray-900 px-4 py-3 text-sm font-semibold text-white hover:bg-gray-800"
				>
					리뷰 작성
				</button>
			{/if}
		{/if}
	</div>
</div>
