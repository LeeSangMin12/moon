<script>
	/**
	 * Service listing page
	 * @component
	 * Displays services with search, infinite scroll, and promotional banners
	 */
	import { create_infinite_scroll } from '$lib/composables/use_infinite_scroll.svelte.js';
	import { create_service_data } from '$lib/composables/use_service_data.svelte.js';
	import { get_api_context } from '$lib/contexts/app_context.svelte.js';
	import five_thousand_coupon_png from '$lib/img/common/banner/5,000_coupon.png';
	import free_outsourcing_png from '$lib/img/common/banner/free_outsourcing.png';
	import leave_opinion_png from '$lib/img/common/banner/leave_opinion.png';

	import Bottom_nav from '$lib/components/ui/Bottom_nav.svelte';
	import Header from '$lib/components/ui/Header.svelte';
	import ServiceTab from '$lib/components/ServiceTab.svelte';

	import Banner from './Banner.svelte';
	import SearchInput from './SearchInput.svelte';

	const api = get_api_context();
	const TITLE = '서비스';

	let { data } = $props();

	/** @type {Array<{title: string, src: string, url: string}>} Banner images */
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

	const serviceData = create_service_data(
		{ services: data.services || [], service_likes: [] },
		api,
	);

	$effect(() => {
		if (data.service_likes) {
			Promise.resolve(data.service_likes).then((likes) => {
				serviceData.serviceLikes = likes;
			});
		}
	});

	const serviceInfiniteScroll = create_infinite_scroll({
		items: serviceData.services,
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

	/**
	 * Handles search input and updates service list
	 * Resets infinite scroll lastId after search
	 */
	const handleSearch = async () => {
		const trimmed_text = searchText.trim();

		serviceData.services = trimmed_text
			? await api.services.select_by_search(trimmed_text)
			: data.services;

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
