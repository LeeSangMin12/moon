<script>
	import { goto } from '$app/navigation';
	import { RiArrowLeftSLine } from 'svelte-remixicon';

	import Bottom_nav from '$lib/components/ui/Bottom_nav/+page.svelte';
	import Header from '$lib/components/ui/Header/+page.svelte';
	import TabSelector from '$lib/components/ui/TabSelector/+page.svelte';

	import colors from '$lib/js/colors';
	import { comma, show_toast } from '$lib/js/common';
	import { api_store } from '$lib/store/api_store';
	import { user_store } from '$lib/store/user_store';

	const TITLE = '주문 내역';

	let { data } = $props();
	let { my_orders, my_sales } = $state(data);

	let selected_tab_index = $state(0);
	const tabs = ['구매', '판매'];

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
		});
	};

	// 주문 승인 (판매자용)
	const handle_approve_order = async (order_id) => {
		try {
			await $api_store.service_orders.approve(order_id);
			show_toast('success', '주문이 승인되었습니다.');

			// 데이터 새로고침
			my_sales = await $api_store.service_orders.select_by_seller_id(
				$user_store.id,
			);
		} catch (error) {
			console.error('주문 승인 실패:', error);
			show_toast('error', '주문 승인에 실패했습니다.');
		}
	};

	// 주문 완료 (판매자용)
	const handle_complete_order = async (order_id) => {
		try {
			await $api_store.service_orders.complete(order_id);
			show_toast('success', '서비스가 완료되었습니다.');

			// 데이터 새로고침
			my_sales = await $api_store.service_orders.select_by_seller_id(
				$user_store.id,
			);
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
			await $api_store.service_orders.cancel(order_id, reason);
			show_toast('success', '주문이 취소되었습니다.');

			// 데이터 새로고침
			if (selected_tab_index === 0) {
				my_orders = await $api_store.service_orders.select_by_buyer_id(
					$user_store.id,
				);
			} else {
				my_sales = await $api_store.service_orders.select_by_seller_id(
					$user_store.id,
				);
			}
		} catch (error) {
			console.error('주문 취소 실패:', error);
			show_toast('error', '주문 취소에 실패했습니다.');
		}
	};
</script>

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
										{get_status_text(order.status)}
									</span>
									<p class="text-primary mt-2 text-lg font-bold">
										₩{comma(order.total_amount)}
									</p>
								</div>
							</div>

							<div class="mt-4 border-t border-gray-100 pt-3">
								<div class="text-sm text-gray-600">
									<p>입금자명: {order.depositor_name}</p>
									<p>은행: {order.bank}</p>
									<p>계좌번호: {order.account_number}</p>
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
								</div>
							</div>
						</div>
					{/each}
				{/if}
			</div>
		{:else}
			<div class="px-4">
				<h2 class="mb-4 text-lg font-semibold">판매한 서비스</h2>

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
										{get_status_text(order.status)}
									</span>
									<p class="text-primary mt-2 text-lg font-bold">
										₩{comma(order.total_amount)}
									</p>
								</div>
							</div>

							<div class="mt-4 border-t border-gray-100 pt-3">
								<div class="text-sm text-gray-600">
									<p>입금자명: {order.depositor_name}</p>
									<p>은행: {order.bank}</p>
									<p>계좌번호: {order.account_number}</p>
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
							</div>
						</div>
					{/each}
				{/if}
			</div>
		{/if}
	</section>
</main>

<Bottom_nav />
