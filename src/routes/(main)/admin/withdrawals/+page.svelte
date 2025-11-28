<script>
	import { goto, invalidateAll } from '$app/navigation';
	import { onMount } from 'svelte';
	import { smart_go_back } from '$lib/utils/navigation';
	import {
		RiArrowLeftSLine,
		RiCheckLine,
		RiCloseLine,
		RiMoneyDollarCircleLine,
		RiTimeLine,
	} from 'svelte-remixicon';

	import Header from '$lib/components/ui/Header.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';

	import colors from '$lib/config/colors';
	import { comma, format_date, show_toast } from '$lib/utils/common';
	import { get_user_context, get_api_context } from '$lib/contexts/app_context.svelte.js';

	const me = get_user_context();
	const api = get_api_context();

	let { data } = $props();
	let pending_withdrawals = $state(data.pending_withdrawals || []);
	let recent_withdrawals = $state(data.recent_withdrawals || []);
	let is_reject_modal_open = $state(false);
	let selected_withdrawal_id = $state(null);
	let reject_reason = $state('');

	// 출금 요청 승인
	const handle_approve = async (withdrawal) => {
		if (!confirm('이 출금 요청을 승인하시겠습니까?')) return;
		try {
			await api.moon_withdrawals.approve(withdrawal.id);
			await api.moon_point_transactions.insert({
				user_id: withdrawal.user_id,
				amount: -withdrawal.amount,
				type: 'withdrawal',
				description: '출금 요청 승인',
			});

			show_toast('success', '출금 요청이 승인되었습니다.');
			await invalidateAll();
			pending_withdrawals = data.pending_withdrawals || [];
			recent_withdrawals = data.recent_withdrawals || [];
		} catch (error) {
			show_toast('error', error.message);
		}
	};

	// 출금 요청 거절 모달 열기
	const open_reject_modal = (withdrawal_id) => {
		selected_withdrawal_id = withdrawal_id;
		reject_reason = '';
		is_reject_modal_open = true;
	};

	// 출금 요청 거절
	const handle_reject = async () => {
		if (!reject_reason.trim()) {
			show_toast('error', '거절 사유를 입력해주세요.');
			return;
		}
		try {
			await api.moon_withdrawals.reject(
				selected_withdrawal_id,
				reject_reason,
			);
			show_toast('success', '출금 요청이 거절되었습니다.');
			is_reject_modal_open = false;
			selected_withdrawal_id = null;
			reject_reason = '';
			await invalidateAll();
			pending_withdrawals = data.pending_withdrawals || [];
			recent_withdrawals = data.recent_withdrawals || [];
		} catch (error) {
			show_toast('error', error.message);
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
	<title>관리자 - 출금 신청 관리</title>
</svelte:head>

<Header>
	<button slot="left" onclick={smart_go_back}>
		<RiArrowLeftSLine size={26} color={colors.gray[600]} />
	</button>
</Header>

<div class="container mx-auto max-w-7xl px-4 py-8">
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-gray-900">문 포인트 출금 신청 관리</h1>
		<p class="mt-2 text-gray-600">사용자들의 출금 요청을 관리합니다.</p>
	</div>

	{#if data.table_missing}
		<div class="rounded-lg border border-yellow-200 bg-yellow-50 p-6">
			<p>moon_withdrawals 테이블이 존재하지 않습니다.</p>
		</div>
	{:else}
		<!-- 통계 카드 -->
		<div class="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3">
			<div
				class="flex items-center rounded-2xl bg-gradient-to-r from-blue-100 to-blue-50 p-6 shadow"
			>
				<RiTimeLine size={32} class="text-blue-400" />
				<div class="ml-4">
					<p class="text-sm font-medium text-blue-700">대기 중인 요청</p>
					<p class="text-3xl font-extrabold text-blue-900">
						{pending_withdrawals.length}건
					</p>
				</div>
			</div>
			<div
				class="flex items-center rounded-2xl bg-gradient-to-r from-green-100 to-green-50 p-6 shadow"
			>
				<RiMoneyDollarCircleLine size={32} class="text-green-400" />
				<div class="ml-4">
					<p class="text-sm font-medium text-green-700">최근 처리된 요청</p>
					<p class="text-3xl font-extrabold text-green-900">
						{recent_withdrawals.length}건
					</p>
				</div>
			</div>
		</div>

		<!-- 대기중인 출금 요청 목록 -->
		<div class="mb-10">
			<h2 class="mb-4 text-xl font-bold text-gray-800">대기중인 출금 요청</h2>
			{#if pending_withdrawals.length === 0}
				<p class="text-gray-400">대기중인 출금 요청이 없습니다.</p>
			{:else}
				<div class="overflow-x-auto rounded-2xl bg-white shadow">
					<table class="min-w-full text-sm">
						<thead>
							<tr class="bg-gray-50 text-gray-700">
								<th class="px-6 py-4 font-semibold">ID</th>
								<th>사용자</th>
								<th>금액(문)</th>
								<th>은행</th>
								<th>계좌번호</th>
								<th>예금주</th>
								<th>신청일</th>
								<th>상태</th>
								<th>관리</th>
							</tr>
						</thead>
						<tbody>
							{#each pending_withdrawals as w}
								<tr
									class="border-b transition last:border-none hover:bg-blue-50"
								>
									<td class="px-6 py-3">{w.id}</td>
									<td
										>{w.users?.name}
										<span class="text-xs text-gray-400"
											>(@{w.users?.handle})</span
										></td
									>
									<td class="font-bold text-blue-700">{comma(w.amount)}문</td>
									<td>{w.bank}</td>
									<td>{w.account_number}</td>
									<td>{w.account_holder}</td>
									<td>{format_date(w.created_at)}</td>
									<td>
										<span
											class={w.status === 'pending'
												? 'inline-block rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold text-yellow-800'
												: w.status === 'approved'
													? 'inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-800'
													: 'inline-block rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-800'}
										>
											{get_status_text(w.status)}
										</span>
									</td>
									<td class="flex min-w-[110px] flex-col items-center gap-2">
										<button
											class="flex items-center gap-1 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-1.5 text-xs font-semibold text-white shadow transition hover:from-blue-600 hover:to-blue-700"
											onclick={() => handle_approve(w)}
										>
											<RiCheckLine size={16} /> 승인
										</button>
										<button
											class="flex items-center gap-1 rounded-lg bg-gradient-to-r from-red-400 to-red-500 px-4 py-1.5 text-xs font-semibold text-white shadow transition hover:from-red-500 hover:to-red-600"
											onclick={() => open_reject_modal(w.id)}
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

		<!-- 최근 처리된 출금 요청 목록 -->
		<div>
			<h2 class="mb-4 text-xl font-bold text-gray-800">
				최근 처리된 출금 요청
			</h2>
			{#if recent_withdrawals.length === 0}
				<p class="text-gray-400">최근 처리된 출금 요청이 없습니다.</p>
			{:else}
				<div class="overflow-x-auto rounded-2xl bg-white shadow">
					<table class="min-w-full text-sm">
						<thead>
							<tr class="bg-gray-50 text-gray-700">
								<th class="px-6 py-4 font-semibold">ID</th>
								<th>사용자</th>
								<th>금액(문)</th>
								<th>은행</th>
								<th>계좌번호</th>
								<th>예금주</th>
								<th>신청일</th>
								<th>상태</th>
								<th>처리일</th>
							</tr>
						</thead>
						<tbody>
							{#each recent_withdrawals as w}
								<tr class="border-b last:border-none">
									<td class="px-6 py-3">{w.id}</td>
									<td
										>{w.users?.name}
										<span class="text-xs text-gray-400"
											>(@{w.users?.handle})</span
										></td
									>
									<td class="font-bold text-blue-700">{comma(w.amount)}문</td>
									<td>{w.bank}</td>
									<td>{w.account_number}</td>
									<td>{w.account_holder}</td>
									<td>{format_date(w.created_at)}</td>
									<td>
										<span
											class={w.status === 'pending'
												? 'inline-block rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold text-yellow-800'
												: w.status === 'approved'
													? 'inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-800'
													: 'inline-block rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-800'}
										>
											{get_status_text(w.status)}
										</span>
									</td>
									<td>{format_date(w.updated_at)}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}
		</div>
	{/if}
</div>

<Modal bind:is_modal_open={is_reject_modal_open} modal_position="center">
	<div class="p-4">
		<h3 class="mb-4 font-semibold">출금 요청 거절</h3>
		<textarea
			bind:value={reject_reason}
			rows="3"
			placeholder="거절 사유를 입력하세요"
			class="w-full rounded border p-2 text-sm focus:outline-none"
		></textarea>
		<div class="mt-4 flex gap-2">
			<button class="btn flex-1" onclick={() => (is_reject_modal_open = false)}>
				취소
			</button>
			<button class="btn btn-error flex-1" onclick={handle_reject}>
				거절
			</button>
		</div>
	</div>
</Modal>
