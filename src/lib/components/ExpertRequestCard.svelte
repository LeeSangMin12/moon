<script>
	/**
	 * 외주 요청 카드 컴포넌트
	 * @component
	 * @description 외주 요청 정보를 카드 형태로 표시하는 컴포넌트
	 */
	import {
		formatApplicationDeadlineRelative,
		formatRewardAmount,
		formatWorkLocation,
		getRequestStatusDisplay,
	} from '$lib/utils/expert-request-utils';
	import { goto } from '$app/navigation';

	/**
	 * @typedef {Object} ExpertRequest
	 * @property {string} id - 요청 ID
	 * @property {string} title - 요청 제목
	 * @property {string} [category] - 카테고리
	 * @property {string} status - 요청 상태
	 * @property {string} application_deadline - 신청 마감일
	 * @property {string} work_location - 근무 지역
	 * @property {number} reward_amount - 보상 금액
	 * @property {string} price_unit - 가격 단위
	 * @property {Array} [expert_request_proposals] - 제안 목록
	 */

	/**
	 * @typedef {Object} Props
	 * @property {ExpertRequest} request - 외주 요청 객체
	 * @property {string} [href] - 링크 URL (기본: `/expert-request/${request.id}`)
	 * @property {string} [class] - 추가 CSS 클래스 (기본: 'mb-4')
	 * @property {Function} [status] - 커스텀 상태 snippet
	 */

	/** @type {Props} */
	let {
		request,
		href,
		class: className = 'mb-4',
		status: statusSnippet
	} = $props();

	// href 기본값 설정 (request가 null일 수 있으므로 분리)
	const resolved_href = $derived(href ?? `/expert-request/${request?.id}`);

	/**
	 * 요청 상태 표시 정보
	 * @type {{text: string, bgColor: string, textColor: string}}
	 */
	const status = $derived(getRequestStatusDisplay(request?.status));

	/**
	 * 제안 개수
	 * @type {number}
	 */
	const proposal_count = $derived(
		request.expert_request_proposals?.[0]?.count || 0
	);

	/**
	 * 카드 클릭 핸들러
	 */
	const handle_click = () => goto(resolved_href);
</script>

{#if request}
<div
	class="cursor-pointer transition-all {className}"
	onclick={handle_click}
	role="button"
	tabindex="0"
	onkeydown={(e) => e.key === 'Enter' && handle_click()}
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
				class="mt-4 line-clamp-2 text-lg font-medium leading-tight text-gray-900"
			>
				{request.title}
			</h3>
		</div>
		{#if statusSnippet}
			<div class="ml-3 flex-shrink-0">
				{@render statusSnippet()}
			</div>
		{:else}
			<span
				class={`ml-3 flex-shrink-0 rounded-md px-2.5 py-1 text-xs font-medium ${status.bgColor} ${status.textColor}`}
			>
				{status.text}
			</span>
		{/if}
	</div>

	<!-- 메타 정보 -->
	<div class="mb-3 flex items-center gap-2 text-sm text-gray-500">
		<span>{formatApplicationDeadlineRelative(request.application_deadline)}</span>
		<span>•</span>
		<span>{formatWorkLocation(request.work_location)}</span>
		<span>•</span>
		<span>제안 {proposal_count}개</span>
	</div>

	<!-- 보상금 -->
	<div class="mb-3">
		<span class="text-lg font-semibold text-blue-600">
			{formatRewardAmount(request.reward_amount, request.price_unit)}
		</span>
	</div>
	<div class="h-0.5 w-full bg-gray-200" />
</div>
{/if}
