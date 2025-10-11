<script>
	import { createExpertRequestData } from '$lib/composables/useExpertRequestData.svelte.js';
	import { createInfiniteScroll } from '$lib/composables/useInfiniteScroll.svelte.js';
	import { createServiceData } from '$lib/composables/useServiceData.svelte.js';
	import free_lawyer_png from '$lib/img/common/banner/free_lawyer.png';
	import leave_opinion_png from '$lib/img/common/banner/leave_opinion.png';
	import sell_service_png from '$lib/img/common/banner/sell_service.png';
	import { onMount } from 'svelte';

	import Bottom_nav from '$lib/components/ui/Bottom_nav.svelte';
	import Header from '$lib/components/ui/Header.svelte';
	import TabSelector from '$lib/components/ui/TabSelector.svelte';
	import ExpertRequestTab from '$lib/components/ExpertRequestTab.svelte';
	import ServiceTab from '$lib/components/ServiceTab.svelte';

	import { get_api_context } from '$lib/contexts/app-context.svelte.js';

	const { api } = get_api_context();

	import Banner from './Banner.svelte';
	import SearchInput from './SearchInput.svelte';

	const TITLE = '서비스';

	let { data } = $props();

	const tabs = ['전문가 찾기', '사이드잡', '풀타임잡'];
	let selected_tab = $state(0);
	let expert_requests_loaded = $state(false);

	const images = [
		{
			title: 'leave_opinion',
			src: leave_opinion_png,
			url: 'https://forms.gle/ZjxT8S4BmsBHsfv87',
		},
		{
			title: 'sell_service',
			src: sell_service_png,
			url: '/regi/service',
		},
	];

	// Initialize with empty data - will be populated when promises resolve
	const serviceData = createServiceData({ services: [], service_likes: [] }, api);
	const expertRequestData = createExpertRequestData({ expert_requests: [] }, api);

	// Resolve streamed services promise
	onMount(async () => {
		console.log('hi');
		if (data.services instanceof Promise) {
			data.services.then((services) => {
				serviceData.services = services;
			});
		} else {
			serviceData.services = data.services || [];
		}

		if (data.service_likes instanceof Promise) {
			data.service_likes.then((likes) => {
				serviceData.serviceLikes = likes;
			});
		} else {
			serviceData.serviceLikes = data.service_likes || [];
		}
	});

	// Lazy load expert requests when switching to tab 1 or 2
	$effect(() => {
		if ((selected_tab === 1 || selected_tab === 2) && !expert_requests_loaded) {
			expert_requests_loaded = true;
			api.expert_requests.select_infinite_scroll('').then((response) => {
				expertRequestData.expertRequests = response.data || response;
			});
		}
	});

	const serviceInfiniteScroll = createInfiniteScroll({
		items: {
			get value() {
				return serviceData.services;
			},
		},
		loadMore: serviceData.loadMoreServices,
		isLoading: {
			get value() {
				return serviceData.isInfiniteLoading;
			},
			set value(val) {
				serviceData.isInfiniteLoading = val;
			},
		},
		targetId: 'infinite_scroll',
	});

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
		if (selected_tab === 0) {
			if (searchText.trim()) {
				const results = await api.services.select_by_search(searchText);
				serviceData.services = results;
			} else {
				serviceData.services = data.services;
			}
			serviceInfiniteScroll.lastId =
				serviceData.services[serviceData.services.length - 1]?.id || '';
		} else {
			if (searchText.trim()) {
				const results =
					await api.expert_requests.select_by_search(searchText);
				expertRequestData.expertRequests = results;
			} else {
				const response =
					await api.expert_requests.select_infinite_scroll('', '');
				expertRequestData.expertRequests = response.data || response;
			}
			expertInfiniteScroll.lastId =
				expertRequestData.expertRequests[
					expertRequestData.expertRequests.length - 1
				]?.id || '';
		}
	};
</script>

<svelte:head>
	<title>서비스 | 문</title>
	<meta
		name="description"
		content="AI·마케팅·디자인·IT 등 다양한 분야의 전문가 서비스를 찾아보고 이용해보세요. 맞춤형 서비스로 니즈를 해결하세요."
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
		placeholder={selected_tab === 0
			? '원하는 전문가 서비스를 검색해보세요'
			: '원하는 판매 서비스를 검색해보세요'}
		bind:value={searchText}
		onSearch={handleSearch}
	/>

	<section class="flex flex-col items-center">
		<Banner {images} />
	</section>

	{#if selected_tab === 0}
		<ServiceTab {serviceData} infiniteScroll={serviceInfiniteScroll} />
	{:else if selected_tab === 1}
		<ExpertRequestTab
			{expertRequestData}
			infiniteScroll={expertInfiniteScroll}
			jobType="sidejob"
		/>
	{:else if selected_tab === 2}
		<ExpertRequestTab
			{expertRequestData}
			infiniteScroll={expertInfiniteScroll}
			jobType="fulltime"
		/>
	{/if}
</main>

<Bottom_nav />
