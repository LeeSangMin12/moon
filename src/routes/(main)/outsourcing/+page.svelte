<script>
	import { create_expert_request_data } from '$lib/composables/use_expert_request_data.svelte.js';
	import { create_infinite_scroll } from '$lib/composables/use_infinite_scroll.svelte.js';
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

	/**
	 * @typedef {Object} ExpertRequestData
	 * @property {Array} expert_requests - 외주 요청 목록
	 * @property {boolean} is_infinite_loading - 무한 스크롤 로딩 상태
	 * @property {Function} load_more_expert_requests - 추가 데이터 로드 함수
	 */

	const api = get_api_context();
	const TITLE = '외주';
	const TABS = ['사이드잡', '풀타임잡'];
	const BANNER_IMAGES = [
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

	let { data } = $props();
	let selected_tab = $state(0);
	let search_text = $state('');

	// job_type별로 데이터와 무한 스크롤 분리 (재생성 방지)
	const sidejob_data = create_expert_request_data(
		{ expert_requests: data.sidejob_requests || [] },
		api,
		'sidejob'
	);

	const fulltime_data = create_expert_request_data(
		{ expert_requests: data.fulltime_requests || [] },
		api,
		'fulltime'
	);

	const sidejob_infinite_scroll = create_infinite_scroll({
		items: {
			get value() {
				return sidejob_data.expert_requests;
			},
		},
		loadMore: sidejob_data.load_more_expert_requests,
		isLoading: {
			get value() {
				return sidejob_data.is_infinite_loading;
			},
			set value(val) {
				sidejob_data.is_infinite_loading = val;
			},
		},
		targetId: 'expert_infinite_scroll',
	});

	const fulltime_infinite_scroll = create_infinite_scroll({
		items: {
			get value() {
				return fulltime_data.expert_requests;
			},
		},
		loadMore: fulltime_data.load_more_expert_requests,
		isLoading: {
			get value() {
				return fulltime_data.is_infinite_loading;
			},
			set value(val) {
				fulltime_data.is_infinite_loading = val;
			},
		},
		targetId: 'expert_infinite_scroll',
	});

	// 현재 선택된 탭의 데이터 가져오기
	const current_data = $derived(selected_tab === 0 ? sidejob_data : fulltime_data);
	const current_infinite_scroll = $derived(
		selected_tab === 0 ? sidejob_infinite_scroll : fulltime_infinite_scroll
	);
	const current_job_type = $derived(selected_tab === 0 ? 'sidejob' : 'fulltime');

	/**
	 * 검색 핸들러
	 */
	const handle_search = async () => {
		if (search_text.trim()) {
			const results = await api.expert_requests.select_by_search(search_text);
			current_data.expert_requests = results;
		} else {
			// 검색어가 없으면 초기 데이터로 복원
			current_data.expert_requests =
				selected_tab === 0 ? data.sidejob_requests : data.fulltime_requests;
		}
		current_infinite_scroll.lastId =
			current_data.expert_requests[current_data.expert_requests.length - 1]?.id || '';
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
	<TabSelector tabs={TABS} bind:selected={selected_tab} />

	<SearchInput
		placeholder="원하는 외주 프로젝트를 검색해보세요"
		bind:value={search_text}
		onSearch={handle_search}
	/>

	<section class="flex flex-col items-center">
		<Banner images={BANNER_IMAGES} />
	</section>

	<ExpertRequestTab
		expert_request_data={current_data}
		infinite_scroll={current_infinite_scroll}
		job_type={current_job_type}
	/>
</main>

<Bottom_nav />
