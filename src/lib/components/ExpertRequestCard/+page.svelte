<script>
	import { goto } from '$app/navigation';
	import {
		formatBudget,
		formatDeadlineRelative,
		getRequestStatusDisplay,
	} from '$lib/utils/expert-request-utils';

	let { request } = $props();
	
	const status = $derived(getRequestStatusDisplay(request.status));
	const proposalCount = $derived(request.expert_request_proposals?.[0]?.count || 0);
	const userInitial = $derived((request.users?.name || request.users?.handle)?.[0]?.toUpperCase());
</script>

<div
	class="cursor-pointer rounded-xl border border-gray-100/60 bg-white p-5 transition-all hover:border-gray-200 hover:shadow-md"
	onclick={() => goto(`/expert-request/${request.id}`)}
>
	<!-- 상단: 제목과 상태 -->
	<div class="mb-3 flex items-center justify-between">
		<h3 class="line-clamp-1 flex-1 pr-3 text-base font-semibold text-gray-900">
			{request.title}
		</h3>
		<span class={`rounded-full px-2.5 py-1 text-xs font-medium ${status.bgColor} ${status.textColor}`}>
			{status.text}
		</span>
	</div>

	<!-- 예산 -->
	<div class="mb-3">
		<span class="text-lg font-bold text-blue-600">
			{formatBudget(request.budget_min, request.budget_max)}
		</span>
	</div>

	<!-- 메타 정보 -->
	<div class="mb-3 flex items-center gap-2 text-sm text-gray-500">
		<span>{formatDeadlineRelative(request.deadline)}</span>
		{#if request.category}
			<span>•</span>
			<span>{request.category}</span>
		{/if}
		<span>•</span>
		<span class="font-medium">제안 {proposalCount}개</span>
	</div>

	<!-- 설명 -->
	<p class="mb-4 line-clamp-2 text-sm leading-relaxed text-gray-600">
		{request.description}
	</p>

	<!-- 하단: 작성자 정보 -->
	<div class="flex items-center justify-between text-sm">
		<div class="flex items-center gap-2">
			{#if request.users?.avatar_url}
				<img
					src={request.users.avatar_url}
					alt=""
					class="aspect-square h-6 w-6 rounded-full object-cover"
				/>
			{:else}
				<div class="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200">
					<span class="text-xs text-gray-500">{userInitial}</span>
				</div>
			{/if}
			<span class="font-medium text-gray-700">
				{request.users?.name || request.users?.handle}
			</span>
		</div>
		<span class="text-gray-400">
			{new Date(request.created_at).toLocaleDateString('ko-KR', {
				month: 'short',
				day: 'numeric',
			})}
		</span>
	</div>
</div>