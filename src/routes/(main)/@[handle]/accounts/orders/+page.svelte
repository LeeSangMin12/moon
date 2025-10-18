<script>
	import colors from '$lib/config/colors';
	import {
		get_api_context,
		get_user_context,
	} from '$lib/contexts/app-context.svelte.js';
	import { comma, show_toast } from '$lib/utils/common';
	import { goto } from '$app/navigation';
	import { RiArrowLeftSLine, RiInformationLine } from 'svelte-remixicon';

	import Bottom_nav from '$lib/components/ui/Bottom_nav.svelte';
	import Header from '$lib/components/ui/Header.svelte';
	import TabSelector from '$lib/components/ui/TabSelector.svelte';

	const { me } = get_user_context();
	const { api } = get_api_context();

	const TITLE = '서비스 구매/판매';

	let { data } = $props();
	let { my_orders, my_sales } = $state(data);

	let selected_tab_index = $state(0);
	const tabs = ['구매', '판매'];

	// 판매자 가이드 표시 여부
	let show_seller_guide = $state(false);

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

	// 주문 상태별 아이콘
	const get_status_icon = (status) => {
		const icon_map = {
			pending: '⏳',
			paid: '💰',
			completed: '✅',
			cancelled: '❌',
			refunded: '↩️',
		};
		return icon_map[status] || '📋';
	};

	// 날짜 포맷팅 함수
	const format_date = (date_string) => {
		return new Date(date_string).toLocaleDateString('ko-KR', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		});
	};

	// 주문 승인 (판매자용)
	const handle_approve_order = async (order_id) => {
		try {
			await api.service_orders.approve(order_id);
			show_toast('success', '주문이 승인되었습니다.');

			// 구매자에게 알림
			try {
				const order = my_sales.find((o) => o.id === order_id);
				if (order?.buyer?.id) {
					await api.notifications.insert({
						recipient_id: order.buyer.id,
						actor_id: me.id,
						type: 'order.approved',
						resource_type: 'order',
						resource_id: String(order_id),
						payload: { service_title: order.service_title, status: 'paid' },
						link_url: `/@${order.buyer.handle}/accounts/orders`,
					});
				}
			} catch (e) {
				console.error('Failed to insert notification (order.approved):', e);
			}

			// 데이터 새로고침
			my_sales = await api.service_orders.select_by_seller_id(me.id);
		} catch (error) {
			console.error('주문 승인 실패:', error);
			show_toast('error', '주문 승인에 실패했습니다.');
		}
	};

	// 주문 완료 (판매자용)
	const handle_complete_order = async (order_id) => {
		try {
			await api.service_orders.complete(order_id);
			show_toast('success', '서비스가 완료되었습니다.');

			// 구매자에게 알림
			try {
				const order = my_sales.find((o) => o.id === order_id);
				if (order?.buyer?.id) {
					await api.notifications.insert({
						recipient_id: order.buyer.id,
						actor_id: me.id,
						type: 'order.completed',
						resource_type: 'order',
						resource_id: String(order_id),
						payload: {
							service_title: order.service_title,
							status: 'completed',
						},
						link_url: `/@${order.buyer.handle}/accounts/orders`,
					});
				}
			} catch (e) {
				console.error('Failed to insert notification (order.completed):', e);
			}

			// 데이터 새로고침
			my_sales = await api.service_orders.select_by_seller_id(me.id);
		} catch (error) {
			console.error('주문 완료 실패:', error);
			show_toast('error', '주문 완료에 실패했습니다.');
		}
	};

	// 주문 취소
	const handle_cancel_order = async (order_id) => {
		const reason = prompt('취소 사유를 입력해주세요.');
		if (!reason) return;

		try {
			await api.service_orders.cancel(order_id, reason);
			show_toast('success', '주문이 취소되었습니다.');

			// 구매자/판매자 모두에게 알림
			try {
				const order =
					selected_tab_index === 0
						? my_orders.find((o) => o.id === order_id)
						: my_sales.find((o) => o.id === order_id);
				if (order?.buyer?.id) {
					await api.notifications.insert({
						recipient_id: order.buyer.id,
						actor_id: me.id,
						type: 'order.cancelled',
						resource_type: 'order',
						resource_id: String(order_id),
						payload: {
							service_title: order.service_title,
							status: 'cancelled',
						},
						link_url: `/@${order.buyer.handle}/accounts/orders`,
					});
				}
				if (order?.seller?.id) {
					await api.notifications.insert({
						recipient_id: order.seller.id,
						actor_id: me.id,
						type: 'order.cancelled',
						resource_type: 'order',
						resource_id: String(order_id),
						payload: {
							service_title: order.service_title,
							status: 'cancelled',
						},
						link_url: `/@${order.seller.handle}/accounts/orders`,
					});
				}
			} catch (e) {
				console.error('Failed to insert notification (order.cancelled):', e);
			}

			// 데이터 새로고침
			if (selected_tab_index === 0) {
				my_orders = await api.service_orders.select_by_buyer_id(me.id);
			} else {
				my_sales = await api.service_orders.select_by_seller_id(me.id);
			}
		} catch (error) {
			console.error('주문 취소 실패:', error);
			show_toast('error', '주문 취소에 실패했습니다.');
		}
	};

	// 판매자 가이드 토글
	const toggle_seller_guide = () => {
		show_seller_guide = !show_seller_guide;
	};
</script>

<svelte:head>
	<title>{TITLE} | 문</title>
	<meta
		name="description"
		content="내가 구매한 서비스와 판매한 서비스를 한눈에 확인하고, 주문을 쉽게 관리할 수 있는 문의 주문 내역 페이지입니다."
	/>
</svelte:head>

<Header>
	<button slot="left" onclick={() => history.back()}>
		<RiArrowLeftSLine size={24} color={colors.gray[600]} />
	</button>
	<h1 slot="center" class="font-semibold">{TITLE}</h1>
</Header>

<main>
	<div class="px-4">
		<TabSelector
			{tabs}
			selected={selected_tab_index}
			on_change={(index) => {
				selected_tab_index = index;
			}}
		/>
	</div>

	<section class="mt-6">
		{#if selected_tab_index === 0}
			<div class="px-4">
				<h2 class="mb-4 text-lg font-semibold">구매한 서비스</h2>

				{#if my_orders.length === 0}
					<div class="py-12 text-center">
						<p class="text-gray-500">구매한 서비스가 없습니다.</p>
					</div>
				{:else}
					{#each my_orders as order}
						<button
							onclick={() => goto(`/@${me.handle}/accounts/orders/${order.id}`)}
							class="mb-3 w-full overflow-hidden rounded-xl border border-gray-200 bg-white p-4 text-left transition-all hover:border-gray-300 hover:shadow-sm"
						>
							<!-- 상태 배지 -->
							<div class="mb-2">
								<span
									class="inline-block rounded-md px-2.5 py-0.5 text-xs font-semibold {get_status_color(
										order.status,
									)}"
								>
									{get_status_text(order.status)}
								</span>
							</div>

							<!-- 서비스 제목 -->
							<h3 class="mb-1 text-base font-bold text-gray-900">
								{order.service_title}
							</h3>

							<!-- 판매자 & 날짜 -->
							<p class="mb-3 text-sm text-gray-500">
								@{order.seller.handle} · {format_date(order.created_at)}
							</p>

							<!-- 결제 금액 -->
							<div class="flex items-baseline justify-between">
								<span class="text-sm text-gray-600">결제 금액</span>
								<span class="text-primary text-xl font-bold"
									>₩{comma(order.total_with_commission)}</span
								>
							</div>
						</button>
					{/each}
				{/if}
			</div>
		{:else}
			<div class="px-4">
				<div class="mb-4 flex items-center justify-between">
					<h2 class="text-lg font-semibold">판매한 서비스</h2>
					<button
						onclick={toggle_seller_guide}
						class="flex items-center gap-1 rounded-md bg-blue-50 px-3 py-1.5 text-sm text-blue-700 hover:bg-blue-100"
					>
						<RiInformationLine size={16} />
						{show_seller_guide ? '가이드 숨기기' : '판매자 가이드'}
					</button>
				</div>

				{#if show_seller_guide}
					<div class="mb-6 rounded-lg bg-blue-50 p-4">
						<h3 class="mb-3 font-semibold text-blue-900">
							📋 판매자 주문 관리 가이드
						</h3>
						<div class="space-y-2 text-sm text-blue-800">
							<div class="flex items-start gap-2">
								<span class="font-medium">1단계:</span>
								<span>고객이 주문하면 "결제 대기" 상태가 됩니다.</span>
							</div>
							<div class="flex items-start gap-2">
								<span class="font-medium">2단계:</span>
								<span>입금 확인 후 "결제 승인" 버튼을 눌러주세요.</span>
							</div>
							<div class="flex items-start gap-2">
								<span class="font-medium">3단계:</span>
								<span>서비스 완료 후 "서비스 완료" 버튼을 눌러주세요.</span>
							</div>
						</div>
					</div>
				{/if}

				{#if my_sales.length === 0}
					<div class="py-12 text-center">
						<p class="text-gray-500">판매한 서비스가 없습니다.</p>
					</div>
				{:else}
					{#each my_sales as order}
						<button
							onclick={() => goto(`/@${me.handle}/accounts/orders/${order.id}`)}
							class="mb-3 w-full overflow-hidden rounded-xl border border-gray-200 bg-white p-4 text-left transition-all hover:border-gray-300 hover:shadow-sm"
						>
							<!-- 상태 배지 -->
							<div class="mb-2">
								<span
									class="inline-block rounded-md px-2.5 py-0.5 text-xs font-semibold {get_status_color(
										order.status,
									)}"
								>
									{get_status_text(order.status)}
								</span>
							</div>

							<!-- 서비스 제목 -->
							<h3 class="mb-1 text-base font-bold text-gray-900">
								{order.service_title}
							</h3>

							<!-- 구매자 & 날짜 -->
							<p class="mb-3 text-sm text-gray-500">
								@{order.buyer.handle} · {format_date(order.created_at)}
							</p>

							<!-- 정산 금액 -->
							<div class="flex items-baseline justify-between">
								<span class="text-sm text-gray-600">정산 금액</span>
								<span class="text-primary text-xl font-bold">
									₩{comma(
										order.total_with_commission + (order.coupon_discount || 0) - order.commission_amount,
									)}
								</span>
							</div>
						</button>
					{/each}
				{/if}
			</div>
		{/if}
	</section>
</main>
