<script>
	import { onMount } from 'svelte';

	import EmptyState from '$lib/components/EmptyState/+page.svelte';
	import ExpertRequestCard from '$lib/components/ExpertRequestCard/+page.svelte';
	import FloatingActionButton from '$lib/components/FloatingActionButton/+page.svelte';
	import LoadingSpinner from '$lib/components/LoadingSpinner/+page.svelte';

	let { expertRequestData, infiniteScroll, jobType = null } = $props();

	// jobType에 따라 필터링된 요청만 표시
	const filteredRequests = $derived(
		jobType
			? expertRequestData.expertRequests.filter((req) => req.job_type === jobType)
			: expertRequestData.expertRequests
	);

	onMount(() => {
		infiniteScroll.initializeLastId();
		infiniteScroll.setupObserver();
	});
</script>

<div class="min-h-screen bg-white">
	<div class="px-4 pb-20">
		{#if filteredRequests && filteredRequests.length > 0}
			<div class="mt-8 space-y-4">
				{#each filteredRequests as request}
					<div class="hover:border-gray-200">
						<ExpertRequestCard {request} />
						<!-- <div class="h-0.5 w-full bg-gray-200" /> -->
					</div>
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
	<LoadingSpinner isLoading={expertRequestData.isInfiniteLoading} />
</div>

<FloatingActionButton href={`/regi/expert-request?job_type=${jobType || 'sidejob'}`} />
