<script>
	import { goto } from '$app/navigation';
	import { RiArrowLeftSLine, RiInformationLine } from 'svelte-remixicon';

	import Bottom_nav from '$lib/components/ui/Bottom_nav.svelte';
	import Header from '$lib/components/ui/Header.svelte';
	import TabSelector from '$lib/components/ui/TabSelector.svelte';

	import colors from '$lib/config/colors';
	import { comma, show_toast } from '$lib/utils/common';
	import { get_user_context, get_api_context } from '$lib/contexts/app-context.svelte.js';

	const { me } = get_user_context();
	const { api } = get_api_context();

	const TITLE = '주문 내역';

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
	<title>주문 내역 | 문</title>
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
						<div class="mb-4 rounded-lg border border-gray-200 bg-white p-4">
							<div class="flex items-start justify-between">
								<div class="flex-1">
									<h3 class="text-lg font-medium">{order.service_title}</h3>
									<p class="mt-1 text-sm text-gray-600">
										판매자: @{order.seller.handle}
									</p>
									<p class="text-sm text-gray-600">
										주문일: {format_date(order.created_at)}
									</p>

									{#if order.special_request}
										<p class="mt-2 text-sm text-gray-600">
											요청사항: {order.special_request}
										</p>
									{/if}
								</div>

								<div class="text-right">
									<span
										class="inline-block rounded-full px-2 py-1 text-xs font-medium {get_status_color(
											order.status,
										)}"
									>
										{get_status_icon(order.status)}
										{get_status_text(order.status)}
									</span>
									<p class="text-primary mt-2 text-lg font-bold">
										₩{comma(order.total_with_commission)}
									</p>
								</div>
							</div>

							<div class="mt-4 border-t border-gray-100 pt-3">
								<div class="text-sm text-gray-600">
									<p>입금자명: {order.depositor_name}</p>
									<p>은행: {order.bank}</p>
									<p>계좌번호: {order.account_number}</p>
									{#if order.buyer_contact}
										<p>연락처: {order.buyer_contact}</p>
									{/if}
								</div>

								<div class="mt-3 flex gap-2">
									<button
										onclick={() => goto(`/service/${order.service_id}`)}
										class="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
									>
										서비스 보기
									</button>

									{#if order.status === 'pending'}
										<button
											onclick={() => handle_cancel_order(order.id)}
											class="rounded-md bg-red-500 px-3 py-1.5 text-sm text-white hover:bg-red-600"
										>
											주문 취소
										</button>
									{/if}

									{#if order.status === 'completed'}
										<button
											onclick={() =>
												goto(`/service/${order.service_id}#reviews`)}
											class="bg-primary hover:bg-primary-dark rounded-md px-3 py-1.5 text-sm text-white"
										>
											리뷰 작성
										</button>
									{/if}
								</div>
							</div>
						</div>
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
							<div class="mt-3 text-xs text-blue-600">
								💡 각 단계별로 상태가 자동으로 업데이트되어 고객에게 알림이
								갑니다.
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
						<div class="mb-4 rounded-lg border border-gray-200 bg-white p-4">
							<div class="flex items-start justify-between">
								<div class="flex-1">
									<h3 class="text-lg font-medium">{order.service_title}</h3>
									<p class="mt-1 text-sm text-gray-600">
										구매자: @{order.buyer.handle}
									</p>
									<p class="text-sm text-gray-600">
										주문일: {format_date(order.created_at)}
									</p>

									{#if order.special_request}
										<p class="mt-2 text-sm text-gray-600">
											구매자 요청: {order.special_request}
										</p>
									{/if}
								</div>

								<div class="text-right">
									<span
										class="inline-block rounded-full px-2 py-1 text-xs font-medium {get_status_color(
											order.status,
										)}"
									>
										{get_status_icon(order.status)}
										{get_status_text(order.status)}
									</span>
									<p class="text-primary mt-2 text-lg font-bold">
										₩{comma(order.unit_price)}
									</p>
								</div>
							</div>

							<div class="mt-4 border-t border-gray-100 pt-3">
								<div class="text-sm text-gray-600">
									<p>입금자명: {order.depositor_name}</p>
									<p>은행: {order.bank}</p>
									<p>계좌번호: {order.account_number}</p>
									{#if order.buyer_contact}
										<p>구매자 연락처: {order.buyer_contact}</p>
									{/if}
								</div>

								<div class="mt-3 flex gap-2">
									<button
										onclick={() => goto(`/service/${order.service_id}`)}
										class="rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
									>
										서비스 보기
									</button>

									{#if order.status === 'pending'}
										<button
											onclick={() => handle_approve_order(order.id)}
											class="rounded-md bg-blue-500 px-3 py-1.5 text-sm text-white hover:bg-blue-600"
										>
											결제 승인
										</button>
									{/if}

									{#if order.status === 'paid'}
										<button
											onclick={() => handle_complete_order(order.id)}
											class="rounded-md bg-green-500 px-3 py-1.5 text-sm text-white hover:bg-green-600"
										>
											서비스 완료
										</button>
									{/if}

									{#if order.status === 'pending' || order.status === 'paid'}
										<button
											onclick={() => handle_cancel_order(order.id)}
											class="rounded-md bg-red-500 px-3 py-1.5 text-sm text-white hover:bg-red-600"
										>
											주문 취소
										</button>
									{/if}
								</div>

								{#if order.status === 'pending'}
									<div
										class="mt-2 rounded-md bg-yellow-50 p-2 text-xs text-yellow-800"
									>
										💡 입금 확인 후 "결제 승인" 버튼을 눌러주세요.
									</div>
								{:else if order.status === 'paid'}
									<div
										class="mt-2 rounded-md bg-blue-50 p-2 text-xs text-blue-800"
									>
										💡 서비스 제공 완료 후 "서비스 완료" 버튼을 눌러주세요.
									</div>
								{/if}
							</div>
						</div>
					{/each}
				{/if}
			</div>
		{/if}
	</section>
</main>
