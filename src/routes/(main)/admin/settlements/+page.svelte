<script>
	import { invalidateAll } from '$app/navigation';
	import { smartGoBack } from '$lib/utils/navigation';
	import {
		RiArrowLeftSLine,
		RiCheckLine,
		RiCloseLine,
		RiMoneyDollarCircleLine,
		RiTimeLine,
		RiEyeLine,
	} from 'svelte-remixicon';

	import Header from '$lib/components/ui/Header.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';

	import colors from '$lib/config/colors';
	import { comma, format_date, show_toast } from '$lib/utils/common';
	import { get_api_context } from '$lib/contexts/app_context.svelte.js';

	const api = get_api_context();

	let { data } = $props();
	let pending_settlements = $state(data.pending_settlements || []);
	let processed_settlements = $state(data.processed_settlements || []);

	// 거절 모달
	let is_reject_modal_open = $state(false);
	let selected_settlement_id = $state(null);
	let reject_reason = $state('');

	// 상세 보기 모달
	let is_detail_modal_open = $state(false);
	let selected_settlement = $state(null);
	let settlement_orders = $state([]);

	// 정산 승인
	const handle_approve = async (settlement) => {
		if (!confirm('이 정산 요청을 승인하시겠습니까?')) return;
		try {
			await api.seller_settlements.approve(settlement.id);
			show_toast('정산 요청이 승인되었습니다.', 'success');
			await invalidateAll();
			pending_settlements = data.pending_settlements || [];
			processed_settlements = data.processed_settlements || [];
		} catch (error) {
			show_toast(error.message, 'error');
		}
	};

	// 거절 모달 열기
	const open_reject_modal = (settlement_id) => {
		selected_settlement_id = settlement_id;
		reject_reason = '';
		is_reject_modal_open = true;
	};

	// 정산 거절
	const handle_reject = async () => {
		if (!reject_reason.trim()) {
			show_toast('거절 사유를 입력해주세요.', 'error');
			return;
		}
		try {
			await api.seller_settlements.reject(selected_settlement_id, reject_reason);
			show_toast('정산 요청이 거절되었습니다.', 'success');
			is_reject_modal_open = false;
			selected_settlement_id = null;
			reject_reason = '';
			await invalidateAll();
			pending_settlements = data.pending_settlements || [];
			processed_settlements = data.processed_settlements || [];
		} catch (error) {
			show_toast(error.message, 'error');
		}
	};

	// 상세 보기
	const open_detail_modal = async (settlement) => {
		selected_settlement = settlement;
		try {
			settlement_orders = await api.seller_settlements.get_settlement_orders(settlement.id);
		} catch (error) {
			settlement_orders = [];
		}
		is_detail_modal_open = true;
	};

	const get_status_text = (status) => {
		switch (status) {
			case 'pending':
				return '대기중';
			case 'approved':
				return '승인됨';
			case 'rejected':
				return '거절됨';
			default:
				return status;
		}
	};

	const get_status_style = (status) => {
		switch (status) {
			case 'pending':
				return 'bg-yellow-100 text-yellow-800';
			case 'approved':
				return 'bg-green-100 text-green-800';
			case 'rejected':
				return 'bg-red-100 text-red-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	};
</script>

<svelte:head>
	<title>관리자 - 서비스 정산 관리</title>
</svelte:head>

<Header>
	<button slot="left" onclick={smartGoBack}>
		<RiArrowLeftSLine size={26} color={colors.gray[600]} />
	</button>
</Header>

<div class="container mx-auto max-w-7xl px-4 py-8">
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-gray-900">서비스 판매 정산 관리</h1>
		<p class="mt-2 text-gray-600">판매자들의 정산 요청을 관리합니다.</p>
	</div>

	<!-- 통계 카드 -->
	<div class="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
		<div
			class="flex items-center rounded-2xl bg-gradient-to-r from-blue-100 to-blue-50 p-6 shadow"
		>
			<RiTimeLine size={32} class="text-blue-400" />
			<div class="ml-4">
				<p class="text-sm font-medium text-blue-700">대기 중인 요청</p>
				<p class="text-3xl font-extrabold text-blue-900">
					{pending_settlements.length}건
				</p>
			</div>
		</div>
		<div
			class="flex items-center rounded-2xl bg-gradient-to-r from-green-100 to-green-50 p-6 shadow"
		>
			<RiMoneyDollarCircleLine size={32} class="text-green-400" />
			<div class="ml-4">
				<p class="text-sm font-medium text-green-700">대기 중 총액</p>
				<p class="text-3xl font-extrabold text-green-900">
					₩{comma(pending_settlements.reduce((sum, s) => sum + s.amount, 0))}
				</p>
			</div>
		</div>
	</div>

	<!-- 대기중인 정산 요청 목록 -->
	<div class="mb-10">
		<h2 class="mb-4 text-xl font-bold text-gray-800">대기중인 정산 요청</h2>
		{#if pending_settlements.length === 0}
			<p class="text-gray-400">대기중인 정산 요청이 없습니다.</p>
		{:else}
			<div class="overflow-x-auto rounded-2xl bg-white shadow">
				<table class="min-w-full text-sm">
					<thead>
						<tr class="bg-gray-50 text-gray-700">
							<th class="px-6 py-4 font-semibold">ID</th>
							<th>판매자</th>
							<th>금액</th>
							<th>은행</th>
							<th>계좌번호</th>
							<th>예금주</th>
							<th>신청일</th>
							<th>상태</th>
							<th>관리</th>
						</tr>
					</thead>
					<tbody>
						{#each pending_settlements as s (s.id)}
							<tr class="border-b transition last:border-none hover:bg-blue-50">
								<td class="px-6 py-3">{s.id}</td>
								<td>
									{s.users?.name}
									<span class="text-xs text-gray-400">(@{s.users?.handle})</span>
								</td>
								<td class="font-bold text-blue-700">₩{comma(s.amount)}</td>
								<td>{s.bank}</td>
								<td>{s.account_number}</td>
								<td>{s.account_holder}</td>
								<td>{format_date(s.created_at)}</td>
								<td>
									<span
										class="inline-block rounded-full px-3 py-1 text-xs font-bold {get_status_style(
											s.status,
										)}"
									>
										{get_status_text(s.status)}
									</span>
								</td>
								<td class="flex min-w-[150px] flex-col items-center gap-2">
									<button
										class="flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 transition hover:bg-gray-200"
										onclick={() => open_detail_modal(s)}
									>
										<RiEyeLine size={14} /> 상세
									</button>
									<button
										class="flex items-center gap-1 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow transition hover:from-blue-600 hover:to-blue-700"
										onclick={() => handle_approve(s)}
									>
										<RiCheckLine size={16} /> 승인
									</button>
									<button
										class="flex items-center gap-1 rounded-lg bg-gradient-to-r from-red-400 to-red-500 px-4 py-1.5 text-xs font-semibold text-white shadow transition hover:from-red-500 hover:to-red-600"
										onclick={() => open_reject_modal(s.id)}
									>
										<RiCloseLine size={16} /> 거절
									</button>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>

	<!-- 처리된 정산 요청 목록 -->
	<div>
		<h2 class="mb-4 text-xl font-bold text-gray-800">최근 처리된 정산 요청</h2>
		{#if processed_settlements.length === 0}
			<p class="text-gray-400">최근 처리된 정산 요청이 없습니다.</p>
		{:else}
			<div class="overflow-x-auto rounded-2xl bg-white shadow">
				<table class="min-w-full text-sm">
					<thead>
						<tr class="bg-gray-50 text-gray-700">
							<th class="px-6 py-4 font-semibold">ID</th>
							<th>판매자</th>
							<th>금액</th>
							<th>은행</th>
							<th>계좌번호</th>
							<th>예금주</th>
							<th>신청일</th>
							<th>상태</th>
							<th>처리일</th>
						</tr>
					</thead>
					<tbody>
						{#each processed_settlements as s (s.id)}
							<tr class="border-b last:border-none">
								<td class="px-6 py-3">{s.id}</td>
								<td>
									{s.users?.name}
									<span class="text-xs text-gray-400">(@{s.users?.handle})</span>
								</td>
								<td class="font-bold text-blue-700">₩{comma(s.amount)}</td>
								<td>{s.bank}</td>
								<td>{s.account_number}</td>
								<td>{s.account_holder}</td>
								<td>{format_date(s.created_at)}</td>
								<td>
									<span
										class="inline-block rounded-full px-3 py-1 text-xs font-bold {get_status_style(
											s.status,
										)}"
									>
										{get_status_text(s.status)}
									</span>
								</td>
								<td>{s.processed_at ? format_date(s.processed_at) : '-'}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>

<!-- 거절 모달 -->
<Modal bind:is_modal_open={is_reject_modal_open} modal_position="center">
	<div class="p-4">
		<h3 class="mb-4 font-semibold">정산 요청 거절</h3>
		<textarea
			bind:value={reject_reason}
			rows="3"
			placeholder="거절 사유를 입력하세요"
			class="w-full rounded border p-2 text-sm focus:outline-none"
		></textarea>
		<div class="mt-4 flex gap-2">
			<button class="btn flex-1" onclick={() => (is_reject_modal_open = false)}> 취소 </button>
			<button class="btn btn-error flex-1" onclick={handle_reject}> 거절 </button>
		</div>
	</div>
</Modal>

<!-- 상세 보기 모달 -->
<Modal bind:is_modal_open={is_detail_modal_open} modal_position="center">
	<div class="max-h-[80vh] overflow-y-auto p-4">
		<h3 class="mb-4 font-semibold">정산 상세 정보</h3>

		{#if selected_settlement}
			<div class="mb-4 rounded-lg bg-gray-50 p-4">
				<div class="grid grid-cols-2 gap-2 text-sm">
					<div>
						<span class="text-gray-500">정산 금액:</span>
						<span class="font-bold">₩{comma(selected_settlement.amount)}</span>
					</div>
					<div>
						<span class="text-gray-500">판매자:</span>
						<span>{selected_settlement.users?.name}</span>
					</div>
					<div>
						<span class="text-gray-500">은행:</span>
						<span>{selected_settlement.bank}</span>
					</div>
					<div>
						<span class="text-gray-500">계좌번호:</span>
						<span>{selected_settlement.account_number}</span>
					</div>
					<div>
						<span class="text-gray-500">예금주:</span>
						<span>{selected_settlement.account_holder}</span>
					</div>
					<div>
						<span class="text-gray-500">신청일:</span>
						<span>{format_date(selected_settlement.created_at)}</span>
					</div>
				</div>
			</div>

			<h4 class="mb-2 font-medium">포함된 주문 목록</h4>
			{#if settlement_orders.length > 0}
				<div class="space-y-2">
					{#each settlement_orders as order (order.id)}
						<div class="rounded border p-3 text-sm">
							<p class="font-medium">{order.service_title}</p>
							<div class="mt-1 flex justify-between text-gray-500">
								<span>완료일: {format_date(order.completed_at)}</span>
								<span class="font-semibold text-gray-900">
									₩{comma(
										order.total_with_commission +
											(order.coupon_discount || 0) -
											order.commission_amount,
									)}
								</span>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<p class="text-sm text-gray-400">포함된 주문 정보를 불러올 수 없습니다.</p>
			{/if}
		{/if}

		<div class="mt-4">
			<button class="btn w-full" onclick={() => (is_detail_modal_open = false)}> 닫기 </button>
		</div>
	</div>
</Modal>
