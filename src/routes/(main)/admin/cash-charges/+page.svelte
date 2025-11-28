<script>
	import { invalidateAll } from '$app/navigation';
	import { smart_go_back } from '$lib/utils/navigation';
	import {
		RiArrowLeftSLine,
		RiCheckLine,
		RiCloseLine,
		RiTimeLine,
		RiWallet3Line,
	} from 'svelte-remixicon';

	import Header from '$lib/components/ui/Header.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';

	import colors from '$lib/config/colors';
	import { comma, format_date, show_toast } from '$lib/utils/common';
	import { get_user_context, get_api_context } from '$lib/contexts/app_context.svelte.js';

	const me = get_user_context();
	const api = get_api_context();

	let { data } = $props();

	let pending_charges = $state(data.pending_charges || []);
	let recent_charges = $state(data.recent_charges || []);

	let is_reject_modal_open = $state(false);
	let is_approve_modal_open = $state(false);
	let selected_charge = $state(null);
	let reject_reason = $state('');

	// 충전 요청 승인 모달 열기
	const open_approve_modal = (charge) => {
		selected_charge = charge;
		is_approve_modal_open = true;
	};

	// 충전 요청 승인
	const handle_approve = async () => {
		if (!selected_charge) return;

		try {
			await api.cash_charges.approve(selected_charge.id, me.id);
			show_toast('success', '충전 요청이 승인되었습니다.');

			is_approve_modal_open = false;
			selected_charge = null;

			// 데이터 새로고침
			await invalidateAll();
			pending_charges = data.pending_charges || [];
			recent_charges = data.recent_charges || [];
		} catch (error) {
			show_toast('error', error.message);
			console.error('충전 승인 실패:', error);
		}
	};

	// 충전 요청 거절 모달 열기
	const open_reject_modal = (charge) => {
		selected_charge = charge;
		reject_reason = '';
		is_reject_modal_open = true;
	};

	// 충전 요청 거절
	const handle_reject = async () => {
		if (!reject_reason.trim()) {
			show_toast('error', '거절 사유를 입력해주세요.');
			return;
		}

		if (!selected_charge) return;

		try {
			await api.cash_charges.reject(selected_charge.id, me.id, reject_reason);
			show_toast('success', '충전 요청이 거절되었습니다.');

			is_reject_modal_open = false;
			selected_charge = null;
			reject_reason = '';

			// 데이터 새로고침
			await invalidateAll();
			pending_charges = data.pending_charges || [];
			recent_charges = data.recent_charges || [];
		} catch (error) {
			show_toast('error', error.message);
			console.error('충전 거절 실패:', error);
		}
	};

	// 상태별 스타일
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
</script>

<svelte:head>
	<title>관리자 - 문캐시 충전 관리</title>
</svelte:head>

<Header>
	<button slot="left" onclick={smart_go_back}>
		<RiArrowLeftSLine size={26} color={colors.gray[600]} />
	</button>
</Header>

<div class="container mx-auto max-w-7xl px-4 py-8">
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-gray-900">문캐시 충전 관리</h1>
		<p class="mt-2 text-gray-600">사용자들의 문캐시 충전 요청을 관리합니다.</p>
	</div>

	<!-- 통계 카드 -->
	<div class="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
		<div class="rounded-lg bg-white p-6 shadow">
			<div class="flex items-center">
				<div class="flex-shrink-0">
					<RiTimeLine size={24} color={colors.yellow} />
				</div>
				<div class="ml-4">
					<p class="text-sm font-medium text-gray-500">대기 중인 요청</p>
					<p class="text-2xl font-semibold text-gray-900">
						{pending_charges.length}건
					</p>
				</div>
			</div>
		</div>

		<div class="rounded-lg bg-white p-6 shadow">
			<div class="flex items-center">
				<div class="flex-shrink-0">
					<RiWallet3Line size={24} color={colors.primary} />
				</div>
				<div class="ml-4">
					<p class="text-sm font-medium text-gray-500">대기 중인 총 금액</p>
					<p class="text-2xl font-semibold text-gray-900">
						{comma(pending_charges.reduce((sum, charge) => sum + charge.amount, 0))}원
					</p>
				</div>
			</div>
		</div>

		<div class="rounded-lg bg-white p-6 shadow">
			<div class="flex items-center">
				<div class="flex-shrink-0">
					<RiCheckLine size={24} color="#22c55e" />
				</div>
				<div class="ml-4">
					<p class="text-sm font-medium text-gray-500">최근 처리</p>
					<p class="text-2xl font-semibold text-gray-900">
						{recent_charges.length}건
					</p>
				</div>
			</div>
		</div>
	</div>

	<!-- 대기 중인 요청들 -->
	<div class="mb-8">
		<h2 class="mb-4 text-xl font-semibold text-gray-900">대기 중인 충전 요청</h2>

		{#if pending_charges.length === 0}
			<div class="rounded-lg bg-white p-8 text-center shadow">
				<RiTimeLine size={48} color={colors.gray[400]} class="mx-auto mb-4" />
				<p class="text-gray-500">대기 중인 충전 요청이 없습니다.</p>
			</div>
		{:else}
			<div class="overflow-hidden rounded-lg bg-white shadow">
				<table class="min-w-full divide-y divide-gray-200">
					<thead class="bg-gray-50">
						<tr>
							<th
								class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
							>
								사용자
							</th>
							<th
								class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
							>
								충전 금액
							</th>
							<th
								class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
							>
								입금자명
							</th>
							<th
								class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
							>
								요청 시간
							</th>
							<th
								class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
							>
								작업
							</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-200 bg-white">
						{#each pending_charges as charge}
							<tr>
								<td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
									<div>
										<div class="font-medium">
											{charge.users?.name || '알 수 없음'}
										</div>
										<div class="text-gray-500">
											@{charge.users?.handle || '알 수 없음'}
										</div>
										<div class="text-xs text-gray-400">
											{charge.users?.email || ''}
										</div>
									</div>
								</td>
								<td class="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
									{comma(charge.amount)}원
								</td>
								<td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
									{charge.depositor_name}
								</td>
								<td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
									{format_date(charge.created_at)}
								</td>
								<td class="whitespace-nowrap px-6 py-4 text-sm font-medium">
									<div class="flex space-x-2">
										<button
											onclick={() => open_approve_modal(charge)}
											class="inline-flex items-center rounded-md bg-green-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500"
										>
											<RiCheckLine size={16} />
											<span class="ml-1">승인</span>
										</button>
										<button
											onclick={() => open_reject_modal(charge)}
											class="inline-flex items-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500"
										>
											<RiCloseLine size={16} />
											<span class="ml-1">거절</span>
										</button>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>

	<!-- 최근 처리된 요청들 -->
	<div>
		<h2 class="mb-4 text-xl font-semibold text-gray-900">최근 처리된 요청</h2>

		{#if recent_charges.length === 0}
			<div class="rounded-lg bg-white p-8 text-center shadow">
				<p class="text-gray-500">최근 처리된 요청이 없습니다.</p>
			</div>
		{:else}
			<div class="overflow-hidden rounded-lg bg-white shadow">
				<table class="min-w-full divide-y divide-gray-200">
					<thead class="bg-gray-50">
						<tr>
							<th
								class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
							>
								사용자
							</th>
							<th
								class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
							>
								충전 금액
							</th>
							<th
								class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
							>
								입금자명
							</th>
							<th
								class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
							>
								상태
							</th>
							<th
								class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
							>
								처리 시간
							</th>
							<th
								class="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500"
							>
								거절 사유
							</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-gray-200 bg-white">
						{#each recent_charges as charge}
							<tr>
								<td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
									<div>
										<div class="font-medium">
											{charge.users?.name || '알 수 없음'}
										</div>
										<div class="text-gray-500">
											@{charge.users?.handle || '알 수 없음'}
										</div>
									</div>
								</td>
								<td class="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
									{comma(charge.amount)}원
								</td>
								<td class="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
									{charge.depositor_name}
								</td>
								<td class="whitespace-nowrap px-6 py-4 text-sm">
									<span
										class="inline-flex rounded-full px-2 py-1 text-xs font-semibold {get_status_style(
											charge.status
										)}"
									>
										{get_status_text(charge.status)}
									</span>
								</td>
								<td class="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
									{format_date(charge.updated_at)}
								</td>
								<td class="px-6 py-4 text-sm text-gray-500">
									{charge.reject_reason || '-'}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>

<!-- 승인 확인 모달 -->
<Modal bind:is_modal_open={is_approve_modal_open} modal_position="center">
	<div class="p-5">
		<p class="text-[16px] font-semibold text-gray-900">
			충전 요청을 승인할까요?
		</p>
		{#if selected_charge}
			<p class="mt-2 text-[14px] text-gray-500">
				{selected_charge.users?.name}님 · {comma(selected_charge.amount)}원
			</p>
		{/if}

		<div class="mt-5 flex gap-2">
			<button
				onclick={() => (is_approve_modal_open = false)}
				class="flex-1 rounded-lg bg-gray-100 py-3 text-[14px] font-medium text-gray-700 active:bg-gray-200"
			>
				취소
			</button>
			<button
				onclick={handle_approve}
				class="flex-1 rounded-lg bg-blue-500 py-3 text-[14px] font-medium text-white active:bg-blue-600"
			>
				승인하기
			</button>
		</div>
	</div>
</Modal>

<!-- 거절 사유 입력 모달 -->
<Modal bind:is_modal_open={is_reject_modal_open} modal_position="center">
	<div class="p-5">
		<p class="text-[16px] font-semibold text-gray-900">
			충전 요청을 거절할까요?
		</p>
		{#if selected_charge}
			<p class="mt-2 text-[14px] text-gray-500">
				{selected_charge.users?.name}님 · {comma(selected_charge.amount)}원
			</p>
		{/if}

		<div class="mt-4">
			<textarea
				bind:value={reject_reason}
				rows="3"
				placeholder="거절 사유를 입력해주세요"
				class="w-full rounded-lg border border-gray-200 px-4 py-3 text-[15px] text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none"
			></textarea>
		</div>

		<div class="mt-4 flex gap-2">
			<button
				onclick={() => (is_reject_modal_open = false)}
				class="flex-1 rounded-lg bg-gray-100 py-3 text-[14px] font-medium text-gray-700 active:bg-gray-200"
			>
				취소
			</button>
			<button
				onclick={handle_reject}
				class="flex-1 rounded-lg bg-red-500 py-3 text-[14px] font-medium text-white active:bg-red-600"
			>
				거절하기
			</button>
		</div>
	</div>
</Modal>
