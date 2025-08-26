<script>
	import {
		formatBudget,
		formatDeadlineRelative,
		getProposalStatusDisplay,
		getRequestStatusDisplay,
	} from '$lib/utils/expert-request-utils';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { smartGoBack } from '$lib/utils/navigation';
	import {
		RiArrowLeftSLine,
		RiCheckLine,
		RiEyeLine,
		RiFileTextLine,
		RiUserLine,
	} from 'svelte-remixicon';

	import Bottom_nav from '$lib/components/ui/Bottom_nav/+page.svelte';
	import Header from '$lib/components/ui/Header/+page.svelte';
	import TabSelector from '$lib/components/ui/TabSelector/+page.svelte';

	import colors from '$lib/js/colors';
	import { comma, show_toast } from '$lib/js/common';
	import { api_store } from '$lib/store/api_store';

	let { data } = $props();
	let { user, my_requests, my_proposals } = $state(data);

	// 탭 관련 상태
	let tabs = ['요청한 서비스', '제안한 서비스'];
	let selected_tab = $state(0);

	// 통계 계산
	let request_stats = $derived({
		total: my_requests.length,
		open: my_requests.filter((r) => r.status === 'open').length,
		in_progress: my_requests.filter((r) => r.status === 'in_progress').length,
		completed: my_requests.filter((r) => r.status === 'completed').length,
	});

	let proposal_stats = $derived({
		total: my_proposals.length,
		pending: my_proposals.filter((p) => p.status === 'pending').length,
		accepted: my_proposals.filter((p) => p.status === 'accepted').length,
		rejected: my_proposals.filter((p) => p.status === 'rejected').length,
	});

	const refresh_data = async () => {
		try {
			my_requests = await $api_store.expert_requests.select_by_requester_id(
				user.id,
			);
			my_proposals =
				await $api_store.expert_request_proposals.select_by_expert_id(user.id);
			show_toast('success', '데이터가 새로고침되었습니다.');
		} catch (error) {
			console.error('Refresh error:', error);
			show_toast('error', '데이터 새로고침 중 오류가 발생했습니다.');
		}
	};
</script>

<svelte:head>
	<title>전문가 서비스 계정 | 문</title>
	<meta
		name="description"
		content="내가 요청하고 제안한 전문가 서비스들을 관리하세요."
	/>
</svelte:head>

<Header>
	<button slot="left" onclick={smartGoBack}>
		<RiArrowLeftSLine size={28} color={colors.gray[600]} />
	</button>
	<h1 slot="center" class="font-semibold">전문가 서비스 계정</h1>
</Header>

<main class="min-h-screen bg-gray-50 pb-20">
	<!-- 사용자 정보 헤더 -->
	<div class="border-b border-gray-100 bg-white px-4 py-6">
		<div class="flex items-center gap-4">
			<div class="flex-1">
				<h2 class="text-xl font-bold text-gray-900">
					{user?.name || user?.handle || '사용자'}
				</h2>
				<p class="text-sm text-gray-600">전문가 서비스 관리</p>
			</div>
			<button
				onclick={refresh_data}
				class="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
			>
				새로고침
			</button>
		</div>
	</div>

	<!-- 탭 선택기 -->
	<div class="bg-white px-4 py-4">
		<TabSelector {tabs} bind:selected={selected_tab} />
	</div>

	<!-- 탭 1: 요청한 서비스 -->
	{#if selected_tab === 0}
		<div class="px-4">
			<!-- 통계 카드 -->
			<div class="mb-6 rounded-xl border border-gray-100 bg-white p-6">
				<h3 class="mb-4 text-lg font-semibold text-gray-900">내 요청 현황</h3>
				<div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
					<div class="text-center">
						<div class="text-2xl font-bold text-gray-900">
							{request_stats.total}
						</div>
						<div class="text-sm text-gray-500">전체</div>
					</div>
					<div class="text-center">
						<div class="text-2xl font-bold text-emerald-600">
							{request_stats.open}
						</div>
						<div class="text-sm text-gray-500">모집중</div>
					</div>
					<div class="text-center">
						<div class="text-2xl font-bold text-amber-600">
							{request_stats.in_progress}
						</div>
						<div class="text-sm text-gray-500">진행중</div>
					</div>
					<div class="text-center">
						<div class="text-2xl font-bold text-gray-600">
							{request_stats.completed}
						</div>
						<div class="text-sm text-gray-500">완료</div>
					</div>
				</div>
			</div>

			<!-- 요청 목록 -->
			{#if my_requests.length > 0}
				<div class="space-y-4">
					{#each my_requests as request}
						<div
							class="cursor-pointer rounded-xl border border-gray-100 bg-white p-5 transition-all hover:shadow-md"
							onclick={() => goto(`/expert-request/${request.id}`)}
						>
							<!-- 상단: 제목과 상태 -->
							<div class="mb-3 flex items-center justify-between">
								<h3
									class="line-clamp-1 flex-1 pr-3 font-semibold text-gray-900"
								>
									{request.title}
								</h3>
								<span
									class={`rounded-full px-2.5 py-1 text-xs font-medium ${getRequestStatusDisplay(request.status).bgColor} ${getRequestStatusDisplay(request.status).textColor}`}
								>
									{getRequestStatusDisplay(request.status).text}
								</span>
							</div>

							<!-- 예산 및 메타 정보 -->
							<div class="mb-3 flex items-center justify-between">
								<span class="text-lg font-bold text-blue-600">
									{formatBudget(request.budget_min, request.budget_max)}
								</span>
								<div class="flex items-center gap-4 text-sm text-gray-500">
									<span>{formatDeadlineRelative(request.deadline)}</span>
									{#if request.category}
										<span>•</span>
										<span>{request.category}</span>
									{/if}
								</div>
							</div>

							<!-- 제안 수 및 등록일 -->
							<div class="flex items-center justify-between text-sm">
								<span class="font-medium text-blue-600">
									제안 {request.expert_request_proposals?.[0]?.count || 0}개
								</span>
								<span class="text-gray-400">
									{new Date(request.created_at).toLocaleDateString('ko-KR', {
										month: 'short',
										day: 'numeric',
									})}
								</span>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="rounded-xl border border-gray-100 bg-white p-8 text-center">
					<div
						class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100"
					>
						<RiFileTextLine size={24} color={colors.gray[400]} />
					</div>
					<h3 class="mb-2 text-lg font-semibold text-gray-900">
						아직 요청한 서비스가 없어요
					</h3>
					<p class="mb-4 text-sm text-gray-600">
						전문가에게 도움을 요청해보세요!
					</p>
					<button
						onclick={() => goto('/regi/expert-request')}
						class="rounded-xl bg-gray-900 px-6 py-3 font-medium text-white transition-colors hover:bg-gray-800"
					>
						전문가 요청하기
					</button>
				</div>
			{/if}
		</div>
	{/if}

	<!-- 탭 2: 제안한 서비스 -->
	{#if selected_tab === 1}
		<div class="px-4">
			<!-- 통계 카드 -->
			<div class="mb-6 rounded-xl border border-gray-100 bg-white p-6">
				<h3 class="mb-4 text-lg font-semibold text-gray-900">내 제안 현황</h3>
				<div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
					<div class="text-center">
						<div class="text-2xl font-bold text-gray-900">
							{proposal_stats.total}
						</div>
						<div class="text-sm text-gray-500">전체</div>
					</div>
					<div class="text-center">
						<div class="text-2xl font-bold text-gray-600">
							{proposal_stats.pending}
						</div>
						<div class="text-sm text-gray-500">검토중</div>
					</div>
					<div class="text-center">
						<div class="text-2xl font-bold text-emerald-600">
							{proposal_stats.accepted}
						</div>
						<div class="text-sm text-gray-500">수락됨</div>
					</div>
					<div class="text-center">
						<div class="text-2xl font-bold text-red-600">
							{proposal_stats.rejected}
						</div>
						<div class="text-sm text-gray-500">거절됨</div>
					</div>
				</div>
			</div>

			<!-- 제안 목록 -->
			{#if my_proposals.length > 0}
				<div class="space-y-4">
					{#each my_proposals as proposal}
						<div
							class="cursor-pointer rounded-xl border border-gray-100 bg-white p-5 transition-all hover:shadow-md"
							onclick={() => goto(`/expert-request/${proposal.request_id}`)}
						>
							<!-- 상단: 프로젝트 제목과 상태 -->
							<div class="mb-3 flex items-center justify-between">
								<h3
									class="line-clamp-1 flex-1 pr-3 font-semibold text-gray-900"
								>
									{proposal.expert_requests?.title || '프로젝트'}
								</h3>
								<span
									class={`rounded-full px-2.5 py-1 text-xs font-medium ${getProposalStatusDisplay(proposal.status).bgColor} ${getProposalStatusDisplay(proposal.status).textColor}`}
								>
									{getProposalStatusDisplay(proposal.status).text}
								</span>
							</div>

							<!-- 제안 예산 및 기간 -->
							{#if proposal.proposed_budget || proposal.proposed_timeline}
								<div class="mb-3 flex items-center gap-6 text-sm">
									{#if proposal.proposed_budget}
										<span class="flex items-center gap-1">
											<span class="text-gray-400">제안 예산:</span>
											<span class="font-semibold text-blue-600"
												>{comma(proposal.proposed_budget)}원</span
											>
										</span>
									{/if}
									{#if proposal.proposed_timeline}
										<span class="flex items-center gap-1">
											<span class="text-gray-400">예상 기간:</span>
											<span class="font-medium text-gray-700"
												>{proposal.proposed_timeline}</span
											>
										</span>
									{/if}
								</div>
							{/if}

							<!-- 제안 메시지 미리보기 -->
							<p
								class="mb-3 line-clamp-2 text-sm leading-relaxed text-gray-600"
							>
								{proposal.message}
							</p>

							<!-- 하단: 요청자 정보 및 제안일 -->
							<div class="flex items-center justify-between text-sm">
								<div class="flex items-center gap-2">
									<span class="text-gray-400">요청자:</span>
									<span class="font-medium text-gray-700">
										{proposal.expert_requests?.users?.name ||
											proposal.expert_requests?.users?.handle ||
											'알 수 없음'}
									</span>
								</div>
								<span class="text-gray-400">
									{new Date(proposal.created_at).toLocaleDateString('ko-KR', {
										month: 'short',
										day: 'numeric',
									})}
								</span>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="rounded-xl border border-gray-100 bg-white p-8 text-center">
					<div
						class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100"
					>
						<RiCheckLine size={24} color={colors.gray[400]} />
					</div>
					<h3 class="mb-2 text-lg font-semibold text-gray-900">
						아직 제안한 서비스가 없어요
					</h3>
					<p class="mb-4 text-sm text-gray-600">
						전문가로서 프로젝트에 제안해보세요!
					</p>
					<button
						onclick={() => goto('/service?tab=1')}
						class="rounded-xl bg-gray-900 px-6 py-3 font-medium text-white transition-colors hover:bg-gray-800"
					>
						전문가 요청 보러가기
					</button>
				</div>
			{/if}
		</div>
	{/if}
</main>

<Bottom_nav />

<style>
	.line-clamp-1 {
		display: -webkit-box;
		-webkit-line-clamp: 1;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
