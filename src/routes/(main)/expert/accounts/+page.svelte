<script>
	import colors from '$lib/config/colors';
	import { get_user_context } from '$lib/contexts/app_context.svelte.js';
	import { comma } from '$lib/utils/common';
	import { smart_go_back } from '$lib/utils/navigation.js';
	import {
		getProposalStatusDisplay,
		getRequestStatusDisplay,
	} from '$lib/utils/expert-request-utils';
	import { RiArrowLeftSLine } from 'svelte-remixicon';

	import Bottom_nav from '$lib/components/ui/Bottom_nav.svelte';
	import Header from '$lib/components/ui/Header.svelte';
	import TabSelector from '$lib/components/ui/TabSelector.svelte';
	import ExpertRequestCard from '$lib/components/ExpertRequestCard.svelte';

	const me = get_user_context();

	let { data } = $props();
	let { my_requests, my_proposals } = $state(data);

	const TITLE = '사이드·풀타임 잡 관리';

	// 탭 관련 상태
	let tabs = ['등록 서비스', '제안 서비스'];
	let selected_tab = $state(0);

	// 주문 상태 표시
	const get_order_status_display = (status) => {
		const status_map = {
			pending: {
				text: '입금대기',
				bgColor: 'bg-yellow-100',
				textColor: 'text-yellow-800',
			},
			paid: {
				text: '입금완료',
				bgColor: 'bg-blue-100',
				textColor: 'text-blue-800',
			},
			completed: {
				text: '완료',
				bgColor: 'bg-green-100',
				textColor: 'text-green-800',
			},
			cancelled: {
				text: '취소',
				bgColor: 'bg-gray-100',
				textColor: 'text-gray-800',
			},
			refunded: {
				text: '환불',
				bgColor: 'bg-red-100',
				textColor: 'text-red-800',
			},
		};
		return status_map[status] || status_map.pending;
	};
</script>

<svelte:head>
	<title>{TITLE} | 문</title>
	<meta
		name="description"
		content="내가 요청하고 제안한 전문가 서비스들을 관리하세요."
	/>
</svelte:head>

<Header>
	<button slot="left" onclick={() => smart_go_back(me)}>
		<RiArrowLeftSLine size={24} color={colors.gray[600]} />
	</button>
	<h1 slot="center" class="font-semibold">{TITLE}</h1>
</Header>

<main class="min-h-screen pb-20">
	<!-- 탭 선택기 -->
	<div class="bg-white px-4 py-4">
		<TabSelector {tabs} bind:selected={selected_tab} />
	</div>

	<!-- 탭 1: 요청한 서비스 -->
	{#if selected_tab === 0}
		<div class="px-4">
			{#if my_requests.length === 0}
				<div class="py-12 text-center">
					<p class="text-gray-500">등록한 서비스가 없습니다.</p>
				</div>
			{:else}
				{#each my_requests as request}
					{@const has_transaction = request.project_amount || request.status === 'pending_payment' || request.status === 'in_progress' || request.status === 'completed'}
					<ExpertRequestCard
						{request}
						href={has_transaction ? `/expert/accounts/${request.id}` : `/expert-request/${request.id}`}
					>
						{#snippet status()}
							{@const statusDisplay = getRequestStatusDisplay(request.status)}
							<span
								class={`rounded-md px-2.5 py-1 text-xs font-medium ${statusDisplay.bgColor} ${statusDisplay.textColor}`}
							>
								{statusDisplay.text}
							</span>
						{/snippet}
					</ExpertRequestCard>
				{/each}
			{/if}
		</div>
	{/if}

	<!-- 탭 2: 제안한 서비스 -->
	{#if selected_tab === 1}
		<div class="px-4">
			{#if my_proposals.length === 0}
				<div class="py-12 text-center">
					<p class="text-gray-500">제안한 서비스가 없습니다.</p>
				</div>
			{:else}
				{#each my_proposals as proposal}
					{@const request = proposal.expert_requests}
					{@const has_transaction = proposal.status === 'accepted' && (request?.project_amount || request?.status === 'pending_payment' || request?.status === 'in_progress' || request?.status === 'completed')}
					<div class="mb-4">
						<ExpertRequestCard
							{request}
							href={has_transaction ? `/expert/accounts/${request?.id}` : `/expert-request/${request?.id}`}
							class="mb-0"
						>
							{#snippet status()}
								{@const proposalStatus = getProposalStatusDisplay(
									proposal.status,
								)}
								{@const requestStatus = getRequestStatusDisplay(
									request?.status || 'open',
								)}
								<div class="flex items-center gap-1.5">
									<span
										class={`rounded-md px-2 py-0.5 text-xs font-medium ${proposalStatus.bgColor} ${proposalStatus.textColor}`}
									>
										{proposalStatus.text}
									</span>
									<span
										class={`rounded-md px-2 py-0.5 text-xs font-medium ${requestStatus.bgColor} ${requestStatus.textColor}`}
									>
										{requestStatus.text}
									</span>
								</div>
							{/snippet}
						</ExpertRequestCard>

						<!-- 수락된 제안: 주문 정보 표시 -->
						{#if proposal.status === 'accepted' && request?.order_status}
							{@const orderStatus = get_order_status_display(request.order_status)}
							<div
								class="mt-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-3"
							>
								<div class="mb-2 flex items-center justify-between">
									<span class="text-sm font-medium text-blue-900">주문 정보</span>
									<span
										class={`rounded-md px-2 py-0.5 text-xs font-medium ${orderStatus.bgColor} ${orderStatus.textColor}`}
									>
										{orderStatus.text}
									</span>
								</div>
								<div class="space-y-1 text-xs text-blue-700">
									<div class="flex justify-between">
										<span>주문 금액</span>
										<span class="font-medium"
											>₩{comma(request.total_with_commission)}</span
										>
									</div>
									<div class="flex justify-between">
										<span>플랫폼 수수료 (5%)</span>
										<span>-₩{comma(request.commission_amount)}</span>
									</div>
									<div
										class="flex justify-between border-t border-blue-200 pt-1 font-semibold"
									>
										<span>정산 금액</span>
										<span
											>₩{comma(
												request.total_with_commission - request.commission_amount,
											)}</span
										>
									</div>
								</div>
								{#if request.order_status === 'pending'}
									<div
										class="mt-2 rounded bg-yellow-50 p-2 text-xs text-yellow-800"
									>
										⏰ 의뢰인의 입금을 확인하고 승인해주세요
									</div>
								{/if}
							</div>
						{/if}
					</div>
				{/each}
			{/if}
		</div>
	{/if}
</main>
