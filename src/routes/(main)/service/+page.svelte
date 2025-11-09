<script>
	import { createInfiniteScroll } from '$lib/composables/useInfiniteScroll.svelte.js';
	import { createServiceData } from '$lib/composables/useServiceData.svelte.js';
	import { get_api_context } from '$lib/contexts/app_context.svelte.js';
	import five_thousand_coupon_png from '$lib/img/common/banner/5,000_coupon.png';
	import free_outsourcing_png from '$lib/img/common/banner/free_outsourcing.png';
	import leave_opinion_png from '$lib/img/common/banner/leave_opinion.png';
	import sell_service_png from '$lib/img/common/banner/sell_service.png';
	import { onMount } from 'svelte';

	import Bottom_nav from '$lib/components/ui/Bottom_nav.svelte';
	import Header from '$lib/components/ui/Header.svelte';
	import ServiceTab from '$lib/components/ServiceTab.svelte';

	import Banner from './Banner.svelte';
	import SearchInput from './SearchInput.svelte';

	const api = get_api_context();

	const TITLE = '서비스';

	let { data } = $props();

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

	// Initialize with empty data - will be populated when promises resolve
	const serviceData = createServiceData(
		{ services: [], service_likes: [] },
		api,
	);

	// Resolve streamed services promise
	onMount(async () => {
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

	let searchText = $state('');

	const handleSearch = async () => {
		if (searchText.trim()) {
			const results = await api.services.select_by_search(searchText);
			serviceData.services = results;
		} else {
			serviceData.services = data.services;
		}
		serviceInfiniteScroll.lastId =
			serviceData.services[serviceData.services.length - 1]?.id || '';
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
	<SearchInput
		placeholder="원하는 전문가 서비스를 검색해보세요"
		bind:value={searchText}
		onSearch={handleSearch}
	/>

	<section class="flex flex-col items-center">
		<Banner {images} />
	</section>

	<ServiceTab {serviceData} infiniteScroll={serviceInfiniteScroll} />
</main>

<Bottom_nav />
