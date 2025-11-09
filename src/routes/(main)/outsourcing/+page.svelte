<script>
	import { createExpertRequestData } from '$lib/composables/useExpertRequestData.svelte.js';
	import { createInfiniteScroll } from '$lib/composables/useInfiniteScroll.svelte.js';
	import { get_api_context } from '$lib/contexts/app_context.svelte.js';
	import five_thousand_coupon_png from '$lib/img/common/banner/5,000_coupon.png';
	import free_outsourcing_png from '$lib/img/common/banner/free_outsourcing.png';
	import leave_opinion_png from '$lib/img/common/banner/leave_opinion.png';

	import Bottom_nav from '$lib/components/ui/Bottom_nav.svelte';
	import Header from '$lib/components/ui/Header.svelte';
	import TabSelector from '$lib/components/ui/TabSelector.svelte';
	import ExpertRequestTab from '$lib/components/ExpertRequestTab.svelte';

	import Banner from '../service/Banner.svelte';
	import SearchInput from '../service/SearchInput.svelte';

	const api = get_api_context();

	const TITLE = '외주';

	let { data } = $props();

	const tabs = ['사이드잡', '풀타임잡'];
	let selected_tab = $state(0);

	const images = [
		{
			title: '5,000_coupon',
			src: five_thousand_coupon_png,
			url: '/event/5,000_coupon',
		},
		{
			title: 'leave_opinion',
			src: leave_opinion_png,
			url: 'https://forms.gle/ZjxT8S4BmsBHsfv87',
		},
		{
			title: 'free_outsourcing',
			src: free_outsourcing_png,
			url: '/event/free_outsourcing',
		},
	];

	// Initialize with server-loaded data
	const expertRequestData = createExpertRequestData(
		{ expert_requests: data.expert_requests || [] },
		api,
	);

	const expertInfiniteScroll = createInfiniteScroll({
		items: {
			get value() {
				return expertRequestData.expertRequests;
			},
		},
		loadMore: expertRequestData.loadMoreExpertRequests,
		isLoading: {
			get value() {
				return expertRequestData.isInfiniteLoading;
			},
			set value(val) {
				expertRequestData.isInfiniteLoading = val;
			},
		},
		targetId: 'expert_infinite_scroll',
	});

	let searchText = $state('');

	const handleSearch = async () => {
		if (searchText.trim()) {
			const results = await api.expert_requests.select_by_search(searchText);
			expertRequestData.expertRequests = results;
		} else {
			// 검색어가 없으면 서버에서 로드한 초기 데이터로 복원
			expertRequestData.expertRequests = data.expert_requests || [];
		}
		expertInfiniteScroll.lastId =
			expertRequestData.expertRequests[
				expertRequestData.expertRequests.length - 1
			]?.id || '';
	};
</script>

<svelte:head>
	<title>외주 | 문</title>
	<meta
		name="description"
		content="사이드잡부터 풀타임 외주까지 다양한 프로젝트를 찾아보세요."
	/>
</svelte:head>

<Header>
	<h1 slot="left" class="font-semibold">{TITLE}</h1>
</Header>

<main>
	<div>
		<TabSelector {tabs} bind:selected={selected_tab} />
	</div>

	<SearchInput
		placeholder="원하는 외주 프로젝트를 검색해보세요"
		bind:value={searchText}
		onSearch={handleSearch}
	/>

	<section class="flex flex-col items-center">
		<Banner {images} />
	</section>

	{#if selected_tab === 0}
		<ExpertRequestTab
			{expertRequestData}
			infiniteScroll={expertInfiniteScroll}
			jobType="sidejob"
		/>
	{:else if selected_tab === 1}
		<ExpertRequestTab
			{expertRequestData}
			infiniteScroll={expertInfiniteScroll}
			jobType="fulltime"
		/>
	{/if}
</main>

<Bottom_nav />
