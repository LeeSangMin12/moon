<script>
	import colors from '$lib/config/colors';
	import {
		get_api_context,
		get_user_context,
	} from '$lib/contexts/app_context.svelte.js';
	import { comma, show_toast } from '$lib/utils/common';
	import {
		getRequestStatusDisplay,
		SUCCESS_MESSAGES,
	} from '$lib/utils/expert-request-utils';
	import { smart_go_back } from '$lib/utils/navigation.js';
	import { goto } from '$app/navigation';
	import { RiArrowLeftSLine } from 'svelte-remixicon';

	import FixedBottomButton from '$lib/components/ui/FixedBottomButton.svelte';
	import Header from '$lib/components/ui/Header.svelte';

	const me = get_user_context();
	const api = get_api_context();

	let { data } = $props();
	let { expert_request, accepted_proposal, is_requester, is_expert } =
		$state(data);

	const TITLE = '거래 상세';

	const status_display = $derived(
		getRequestStatusDisplay(expert_request.status),
	);

	// 플랫폼 입금 계좌
	const platform_account = {
		bank: '부산은행',
		number: '101-2094-2262-04',
		holder: '퓨처밴스 이상민',
	};

	// 프로젝트 완료
	const complete_project = async () => {
		if (
			!confirm(
				'프로젝트를 완료하시겠습니까?\n완료 시 전문가에게 정산금이 지급됩니다.',
			)
		) {
			return;
		}

		try {
			await api.expert_requests.complete_project_with_commission(
				expert_request.id,
			);
			show_toast('success', SUCCESS_MESSAGES.PROJECT_COMPLETED);

			// 데이터 새로고침
			const updated = await api.expert_requests.select_by_id(expert_request.id);
			expert_request = updated;
		} catch (error) {
			console.error('프로젝트 완료 실패:', error);
			show_toast('error', '프로젝트 완료에 실패했습니다.');
		}
	};
</script>

<svelte:head>
	<title>{TITLE} | 문</title>
</svelte:head>

<Header>
	<button slot="left" onclick={() => smart_go_back(me)}>
		<RiArrowLeftSLine size={24} color={colors.gray[600]} />
	</button>
	<h1 slot="center" class="font-semibold">{TITLE}</h1>
</Header>

<main class="min-h-screen bg-gray-50 px-4 pt-4 pb-24">
	<!-- 프로젝트 + 거래 정보 통합 -->
	<div class="rounded-xl border border-gray-200 bg-white p-4">
		<!-- 상단: 제목 + 상태 -->
		<div class="mb-4 flex items-start justify-between">
			<div class="flex-1">
				<p class="text-xs text-gray-500">{expert_request.category}</p>
				<h2 class="mt-1 font-semibold text-gray-900">{expert_request.title}</h2>
			</div>
			<span
				class={`rounded-md px-2.5 py-1 text-xs font-medium ${status_display.bgColor} ${status_display.textColor}`}
			>
				{status_display.text}
			</span>
		</div>

		<!-- 거래 당사자 -->
		<div class="space-y-2 border-t border-gray-100 pt-4">
			<div class="flex items-center justify-between text-sm">
				<span class="text-gray-500">의뢰인</span>
				<span class="text-gray-900">
					{expert_request.users?.name || expert_request.users?.handle}
					{#if is_requester}<span class="text-blue-600">(나)</span>{/if}
				</span>
			</div>
			{#if accepted_proposal}
				<div class="flex items-center justify-between text-sm">
					<span class="text-gray-500">전문가</span>
					<span class="text-gray-900">
						{accepted_proposal.users?.name || accepted_proposal.users?.handle}
						{#if is_expert}<span class="text-blue-600">(나)</span>{/if}
					</span>
				</div>
			{/if}
		</div>

		<!-- 금액 -->
		{#if expert_request.project_amount}
			<div class="mt-4 border-t border-gray-100 pt-4">
				{#if is_expert}
					<div class="flex items-center justify-between">
						<span class="text-sm text-gray-500">정산 예정</span>
						<span class="text-lg font-bold text-gray-900">
							₩{comma(expert_request.expert_payout)}
						</span>
					</div>
					<p class="mt-1 text-xs text-gray-400">
						프로젝트 ₩{comma(expert_request.project_amount)} - 수수료 ₩{comma(
							expert_request.commission_amount,
						)}
					</p>
				{:else}
					<div class="flex items-center justify-between">
						<span class="text-sm text-gray-500">결제 금액</span>
						<span class="text-lg font-bold text-gray-900">
							₩{comma(expert_request.project_amount)}
						</span>
					</div>
				{/if}
			</div>
		{/if}

		<!-- 입금 계좌 (pending_payment 상태일 때만) -->
		{#if is_requester && expert_request.status === 'pending_payment'}
			<div class="mt-4 rounded-lg bg-gray-50 p-3">
				<p class="text-sm font-medium text-gray-900">
					{platform_account.bank}
					{platform_account.number}
				</p>
				<p class="text-xs text-gray-500">{platform_account.holder}</p>
			</div>
		{/if}

		<!-- 공고 보기 링크 -->
		<button
			onclick={() => goto(`/expert-request/${expert_request.id}`)}
			class="mt-4 text-sm text-gray-500 hover:text-gray-700"
		>
			공고 보기 →
		</button>
	</div>

	<!-- 진행 상태 -->
	<div class="mt-4 rounded-xl border border-gray-200 bg-white p-4">
		<div class="flex items-center gap-3">
			{#each ['제안 수락', '입금 확인', '진행 중', '완료'] as step, i}
				{@const is_done =
					i === 0 ||
					(i === 1 && expert_request.status !== 'pending_payment') ||
					(i === 2 &&
						(expert_request.status === 'in_progress' ||
							expert_request.status === 'completed')) ||
					(i === 3 && expert_request.status === 'completed')}
				<div class="flex items-center gap-2">
					<div
						class={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${
							is_done ? 'bg-gray-900 text-white' : 'bg-gray-200 text-gray-400'
						}`}
					>
						{is_done ? '✓' : i + 1}
					</div>
					<span
						class={`text-xs ${is_done ? 'text-gray-900' : 'text-gray-400'}`}
					>
						{step}
					</span>
				</div>
				{#if i < 3}
					<div
						class={`h-px flex-1 ${is_done ? 'bg-gray-300' : 'bg-gray-200'}`}
					></div>
				{/if}
			{/each}
		</div>
	</div>

</main>

<!-- 하단 고정 버튼 -->
{#if is_requester && expert_request.status === 'in_progress'}
	<FixedBottomButton onclick={complete_project}>
		프로젝트 완료
	</FixedBottomButton>
{:else if is_requester && expert_request.status === 'completed'}
	<FixedBottomButton onclick={() => goto(`/expert-request/${expert_request.id}`)}>
		리뷰 작성
	</FixedBottomButton>
{/if}
