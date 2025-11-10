<script>
	import { onMount } from 'svelte';

	import EmptyState from '$lib/components/EmptyState.svelte';
	import ExpertRequestCard from '$lib/components/ExpertRequestCard.svelte';
	import FloatingActionButton from '$lib/components/FloatingActionButton.svelte';
	import LoadingSpinner from '$lib/components/LoadingSpinner.svelte';

	/**
	 * @typedef {Object} Props
	 * @property {Object} expert_request_data - 외주 요청 데이터 객체
	 * @property {Object} infinite_scroll - 무한 스크롤 객체
	 * @property {string} job_type - 작업 유형 ('sidejob' | 'fulltime')
	 */

	/** @type {Props} */
	let { expert_request_data, infinite_scroll, job_type } = $props();

	/**
	 * 컴포넌트 마운트 시 무한 스크롤 초기화
	 */
	onMount(() => {
		infinite_scroll.initializeLastId();
		const cleanup = infinite_scroll.setupObserver();
		return cleanup;
	});
</script>

<div class="min-h-screen bg-white">
	<div class="px-4 pb-20">
		{#if expert_request_data.expert_requests.length > 0}
			<div class="mt-8 space-y-4">
				{#each expert_request_data.expert_requests as request (request.id)}
					<ExpertRequestCard {request} />
				{/each}
			</div>
		{:else}
			<EmptyState
				title="아직 등록된 요청이 없어요"
				description="첫 번째로 전문가를 찾아보세요!"
			/>
		{/if}
	</div>

	<div id="expert_infinite_scroll"></div>
	<LoadingSpinner isLoading={expert_request_data.is_infinite_loading} />
</div>

<FloatingActionButton href={`/regi/expert-request?job_type=${job_type}`} />
