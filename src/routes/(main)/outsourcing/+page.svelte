<script>
	import { create_expert_request_data } from '$lib/composables/use_expert_request_data.svelte.js';
	import { create_infinite_scroll } from '$lib/composables/use_infinite_scroll.svelte.js';
	import { get_api_context } from '$lib/contexts/app_context.svelte.js';
	import five_thousand_coupon_png from '$lib/img/common/banner/5,000_coupon.png';
	import leave_opinion_png from '$lib/img/common/banner/leave_opinion.png';

	import Bottom_nav from '$lib/components/ui/Bottom_nav.svelte';
	import Header from '$lib/components/ui/Header.svelte';
	import TabSelector from '$lib/components/ui/TabSelector.svelte';
	import ExpertRequestTab from '$lib/components/ExpertRequestTab.svelte';

	import Banner from '../service/Banner.svelte';
	import SearchInput from '../service/SearchInput.svelte';

	// ===== Constants =====
	const TITLE = '외주';
	const TABS = ['사이드잡', '풀타임잡'];
	const JOB_TYPES = ['sidejob', 'fulltime'];
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
	];

	// ===== Context =====
	const api = get_api_context();

	// ===== Props =====
	let { data } = $props();

	// ===== State =====
	let selected_tab = $state(0);
	let search_text = $state('');

	// ===== Helper Functions =====
	/**
	 * 무한 스크롤 설정을 생성하는 헬퍼 함수
	 * @param {Object} data - expert request 데이터 객체
	 * @returns {Object} 무한 스크롤 설정 객체
	 */
	function create_infinite_scroll_config(data) {
		return {
			items: {
				get value() {
					return data.expert_requests;
				},
			},
			loadMore: data.load_more_expert_requests,
			isLoading: {
				get value() {
					return data.is_infinite_loading;
				},
				set value(val) {
					data.is_infinite_loading = val;
				},
			},
			targetId: 'expert_infinite_scroll',
		};
	}

	// ===== Data Management =====
	const sidejob_data = create_expert_request_data(
		{ expert_requests: data.sidejob_requests || [] },
		api,
		JOB_TYPES[0],
	);

	const fulltime_data = create_expert_request_data(
		{ expert_requests: data.fulltime_requests || [] },
		api,
		JOB_TYPES[1],
	);

	const sidejob_infinite_scroll = create_infinite_scroll(
		create_infinite_scroll_config(sidejob_data),
	);
	const fulltime_infinite_scroll = create_infinite_scroll(
		create_infinite_scroll_config(fulltime_data),
	);

	// ===== Derived State =====
	/**
	 * 현재 선택된 탭의 데이터
	 * @type {Object}
	 */
	const current_data = $derived(
		selected_tab === 0 ? sidejob_data : fulltime_data,
	);

	/**
	 * 현재 선택된 탭의 무한 스크롤 설정
	 * @type {Object}
	 */
	const current_infinite_scroll = $derived(
		selected_tab === 0 ? sidejob_infinite_scroll : fulltime_infinite_scroll,
	);

	/**
	 * 현재 선택된 작업 유형
	 * @type {string}
	 */
	const current_job_type = $derived(JOB_TYPES[selected_tab]);

	/**
	 * 현재 탭의 초기 데이터
	 * @type {Array}
	 */
	const initial_requests = $derived(
		selected_tab === 0 ? data.sidejob_requests : data.fulltime_requests,
	);

	// ===== Event Handlers =====
	/**
	 * 검색 실행 핸들러
	 * 검색어가 있으면 검색, 없으면 초기 데이터로 복원
	 * @returns {Promise<void>}
	 */
	const handle_search = async () => {
		const trimmed = search_text.trim();

		if (trimmed) {
			const results = await api.expert_requests.select_by_search(trimmed);
			current_data.expert_requests = results;
		} else {
			current_data.expert_requests = initial_requests;
		}

		// 무한 스크롤 lastId 업데이트
		const last_request =
			current_data.expert_requests[current_data.expert_requests.length - 1];
		current_infinite_scroll.lastId = last_request?.id || '';
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
