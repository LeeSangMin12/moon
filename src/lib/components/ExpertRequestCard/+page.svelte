<script>
	import {
		formatApplicationDeadlineRelative,
		formatMaxApplicants,
		formatRewardAmount,
		formatWorkLocation,
		getRequestStatusDisplay,
	} from '$lib/utils/expert-request-utils';
	import { goto } from '$app/navigation';

	let { request } = $props();

	const status = $derived(getRequestStatusDisplay(request.status));
	const proposalCount = $derived(
		request.expert_request_proposals?.[0]?.count || 0,
	);
	const userInitial = $derived(
		(request.users?.name || request.users?.handle)?.[0]?.toUpperCase(),
	);
</script>

<div
	class="cursor-pointer transition-all"
	onclick={() => goto(`/expert-request/${request.id}`)}
>
	<!-- 상단: 카테고리 칩과 상태 -->
	<div class="mb-1 flex items-start justify-between">
		<div class="flex-1">
			{#if request.category}
				<div class="mb-2">
					<span
						class="inline-flex items-center rounded-md bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600"
					>
						{request.category}
					</span>
				</div>
			{/if}
			<h3
				class="mt-4 line-clamp-2 text-lg leading-tight font-medium text-gray-900"
			>
				{request.title}
			</h3>
		</div>
		<span
			class={`ml-3 flex-shrink-0 rounded-md px-2.5 py-1 text-xs font-medium ${status.bgColor} ${status.textColor}`}
		>
			{status.text}
		</span>
	</div>

	<!-- 메타 정보 -->
	<div class="mb-3 flex items-center gap-2 text-sm text-gray-500">
		<span
			>{formatApplicationDeadlineRelative(request.application_deadline)}</span
		>
		<span>•</span>
		<span>{formatWorkLocation(request.work_location)}</span>
	</div>

	<!-- 보상금 -->
	<div class="mb-3">
		<span class=" text-lg font-semibold text-blue-600">
			{formatRewardAmount(request.reward_amount, request.price_unit)}
		</span>
	</div>
	<div class="h-0.5 w-full bg-gray-200" />
</div>
