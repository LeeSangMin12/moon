<script>
	import free_lawyer_png from '$lib/img/common/banner/free_lawyer.png';
	import leave_opinion_png from '$lib/img/common/banner/leave_opinion.png';
	import sell_service_png from '$lib/img/common/banner/sell_service.png';
	import {
		formatBudget,
		formatDeadlineRelative,
		getRequestStatusDisplay,
	} from '$lib/utils/expert-request-utils';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { RiAddLine, RiHeartFill } from 'svelte-remixicon';

	import Bottom_nav from '$lib/components/ui/Bottom_nav/+page.svelte';
	import Header from '$lib/components/ui/Header/+page.svelte';
	import Icon from '$lib/components/ui/Icon/+page.svelte';
	import TabSelector from '$lib/components/ui/TabSelector/+page.svelte';
	import Banner from '$lib/components/Banner/+page.svelte';
	import Service from '$lib/components/Service/+page.svelte';

	import colors from '$lib/js/colors';
	import { check_login, comma, show_toast } from '$lib/js/common';
	import { api_store } from '$lib/store/api_store';

	const TITLE = '서비스';

	let { data } = $props();
	let services = $state(data.services);
	let service_likes = $state(data.service_likes);
	let expert_requests = $state(data.expert_requests);

	// 디버깅을 위한 로그
	console.log('Initial expert_requests:', expert_requests);

	// 탭 관련 상태
	let tabs = ['서비스 찾기', '전문가 찾기'];
	let selected_tab = $state(0);

	let images = [
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
		{
			title: 'free_lawyer',
			src: free_lawyer_png,
			url: 'https://www.notion.so/2494cb364b428057bfdced50db5e0353',
		},
	];

	let search_text = $state('');
	let is_infinite_loading = $state(false);
	let last_service_id = $state('');

	// 전문가 찾기 탭용 상태
	let expert_search_text = $state('');
	let is_expert_infinite_loading = $state(false);
	let last_expert_request_id = $state('');
	let selected_category = $state('');

	onMount(() => {
		last_service_id = services[services.length - 1]?.id || '';
		last_expert_request_id =
			expert_requests[expert_requests.length - 1]?.id || '';
		infinite_scroll();
		expert_infinite_scroll();
	});

	/**
	 * 무한스크롤 함수
	 */
	const infinite_scroll = () => {
		const observer = new IntersectionObserver((entries) => {
			entries.forEach((entry) => {
				if (services.length >= 10 && entry.isIntersecting) {
					is_infinite_loading = true;
					setTimeout(() => {
						load_more_data();
					}, 1000);
				}
			});
		});

		const target = document.getElementById('infinite_scroll');
		observer.observe(target);
	};

	/**
	 * 무한스크롤 데이터 더 가져오기
	 */
	const load_more_data = async () => {
		const available_service =
			await $api_store.services.select_infinite_scroll(last_service_id);
		is_infinite_loading = false;

		//더 불러올 값이 있을때만 조회
		if (available_service.length !== 0) {
			services = [...services, ...available_service];

			last_service_id =
				available_service[available_service.length - 1]?.id || '';
		}
	};

	const handle_search = async () => {
		services = await $api_store.services.select_by_search(search_text);
		last_service_id = services[services.length - 1]?.id || '';
	};

	/**
	 * 전문가 요청 무한스크롤 함수
	 */
	const expert_infinite_scroll = () => {
		const observer = new IntersectionObserver((entries) => {
			entries.forEach((entry) => {
				if (expert_requests.length >= 10 && entry.isIntersecting) {
					is_expert_infinite_loading = true;
					setTimeout(() => {
						load_more_expert_requests();
					}, 1000);
				}
			});
		});

		const target = document.getElementById('expert_infinite_scroll');
		if (target) observer.observe(target);
	};

	/**
	 * 전문가 요청 무한스크롤 데이터 더 가져오기
	 */
	const load_more_expert_requests = async () => {
		const response = await $api_store.expert_requests.select_infinite_scroll(
			last_expert_request_id,
			selected_category,
		);
		is_expert_infinite_loading = false;

		// API 응답 형태에 맞게 처리 (새 형태: {data, hasMore, nextCursor} 또는 이전 형태: 배열)
		const available_requests = response.data || response;

		//더 불러올 값이 있을때만 조회
		if (available_requests.length !== 0) {
			expert_requests = [...expert_requests, ...available_requests];
			last_expert_request_id =
				response.nextCursor ||
				available_requests[available_requests.length - 1]?.id ||
				'';
		}
	};

	const handle_expert_search = async () => {
		if (expert_search_text.trim()) {
			expert_requests =
				await $api_store.expert_requests.select_by_search(expert_search_text);
		} else {
			const response = await $api_store.expert_requests.select_infinite_scroll(
				'',
				selected_category,
			);
			expert_requests = response.data || response;
		}
		last_expert_request_id =
			expert_requests[expert_requests.length - 1]?.id || '';
	};

	const filter_by_category = async (category) => {
		selected_category = category;
		const response = await $api_store.expert_requests.select_infinite_scroll(
			'',
			category,
		);
		expert_requests = response.data || response;
		last_expert_request_id =
			expert_requests[expert_requests.length - 1]?.id || '';
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
	<!-- 탭 선택기 -->
	<div class="px-4">
		<TabSelector {tabs} bind:selected={selected_tab} />
	</div>

	<!-- 탭 1: 서비스 찾기 -->
	{#if selected_tab === 0}
		<!-- 검색 섹션 -->
		<div class="bg-white px-4 py-4">
			<div class="relative">
				<input
					type="text"
					placeholder="원하는 판매 서비스를 검색해보세요"
					class="w-full rounded-xl border-0 bg-gray-50 px-4 py-4 text-base font-medium placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-gray-200 focus:outline-none"
					bind:value={search_text}
					onkeydown={async (e) => {
						if (e.key === 'Enter') await handle_search();
					}}
				/>
				<button
					class="absolute top-1/2 right-4 -translate-y-1/2"
					onclick={async () => await handle_search()}
				>
					<Icon attribute="search" size={20} color={colors.gray[400]} />
				</button>
			</div>
		</div>

		<section class=" flex flex-col items-center">
			<Banner {images} />
		</section>

		<section>
			<div class="mt-4 grid grid-cols-2 gap-4 px-4 sm:grid-cols-3">
				{#each services as service}
					<Service {service} {service_likes} />
				{/each}
			</div>

			<div id="infinite_scroll"></div>

			<div class="flex justify-center py-4">
				<div
					class={`border-primary h-8 w-8 animate-spin rounded-full border-t-2 border-b-2 ${
						is_infinite_loading === false ? 'hidden' : ''
					}`}
				></div>
			</div>
		</section>

		<!-- floating right button -->
		<div
			class="fixed bottom-18 z-10 mx-auto flex w-full max-w-screen-md justify-end pr-4"
		>
			<button
				class="rounded-full bg-blue-500 p-4 text-white shadow-lg hover:bg-blue-600"
				onclick={() => {
					if (!check_login()) return;
					goto('/regi/service');
				}}
			>
				<RiAddLine size={20} color={colors.white} />
			</button>
		</div>
	{/if}

	<!-- 탭 2: 전문가 찾기 -->
	{#if selected_tab === 1}
		<div class="min-h-screen bg-white">
			<!-- 검색 섹션 -->
			<div class="bg-white px-4 py-6">
				<div class="relative">
					<input
						type="text"
						placeholder="원하는 전문가 서비스를 검색해보세요"
						class="w-full rounded-xl border-0 bg-gray-50 px-4 py-4 text-base font-medium placeholder-gray-400 focus:bg-white focus:ring-2 focus:ring-gray-200 focus:outline-none"
						bind:value={expert_search_text}
						onkeydown={async (e) => {
							if (e.key === 'Enter') await handle_expert_search();
						}}
					/>
					<button
						class="absolute top-1/2 right-4 -translate-y-1/2"
						onclick={async () => await handle_expert_search()}
					>
						<Icon attribute="search" size={20} color={colors.gray[400]} />
					</button>
				</div>
			</div>

			<!-- 전문가 요청 목록 -->
			<div class="px-4 pb-20">
				{#if expert_requests && expert_requests.length > 0}
					<div class="mb-4">
						<p class="text-lg font-bold text-gray-900">
							{expert_requests.length}개 요청
						</p>
					</div>

					<div class="space-y-3">
						{#each expert_requests as request}
							<div
								class="cursor-pointer rounded-xl border border-gray-100/60 bg-white p-5 transition-all hover:border-gray-200 hover:shadow-md"
								onclick={() => goto(`/expert-request/${request.id}`)}
							>
								<!-- 상단: 제목과 상태 -->
								<div class="mb-3 flex items-center justify-between">
									<h3
										class="line-clamp-1 flex-1 pr-3 text-base font-semibold text-gray-900"
									>
										{request.title}
									</h3>
									<span
										class={`rounded-full px-2.5 py-1 text-xs font-medium ${getRequestStatusDisplay(request.status).bgColor} ${getRequestStatusDisplay(request.status).textColor}`}
									>
										{getRequestStatusDisplay(request.status).text}
									</span>
								</div>

								<!-- 예산 -->
								<div class="mb-3">
									<span class="text-lg font-bold text-blue-600">
										{formatBudget(request.budget_min, request.budget_max)}
									</span>
								</div>

								<!-- 메타 정보 -->
								<div class="mb-3 flex items-center gap-2 text-sm text-gray-500">
									<span>{formatDeadlineRelative(request.deadline)}</span>
									{#if request.category}
										<span>•</span>
										<span>{request.category}</span>
									{/if}
									<span>•</span>
									<span class="font-medium"
										>제안 {request.expert_request_proposals?.[0]?.count ||
											0}개</span
									>
								</div>

								<!-- 설명 -->
								<p
									class="mb-4 line-clamp-2 text-sm leading-relaxed text-gray-600"
								>
									{request.description}
								</p>

								<!-- 하단: 작성자 정보 -->
								<div class="flex items-center justify-between text-sm">
									<div class="flex items-center gap-2">
										{#if request.users?.avatar_url}
											<img
												src={request.users.avatar_url}
												alt=""
												class="aspect-square h-6 w-6 rounded-full object-cover"
											/>
										{:else}
											<div
												class="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200"
											>
												<span class="text-xs text-gray-500">
													{(request.users?.name ||
														request.users?.handle)?.[0]?.toUpperCase()}
												</span>
											</div>
										{/if}
										<span class="font-medium text-gray-700">
											{request.users?.name || request.users?.handle}
										</span>
									</div>
									<span class="text-gray-400">
										{new Date(request.created_at).toLocaleDateString('ko-KR', {
											month: 'short',
											day: 'numeric',
										})}
									</span>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<div
						class="rounded-2xl border border-gray-100 bg-white p-8 text-center"
					>
						<div
							class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100"
						>
							<Icon attribute="search" size={24} color={colors.gray[400]} />
						</div>
						<h3 class="mb-2 text-lg font-bold text-gray-900">
							아직 등록된 요청이 없어요
						</h3>
						<p class="text-sm text-gray-600">첫 번째로 전문가를 찾아보세요!</p>
					</div>
				{/if}
			</div>

			<div id="expert_infinite_scroll"></div>

			{#if is_expert_infinite_loading}
				<div class="flex justify-center py-4">
					<div
						class="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-gray-900"
					></div>
				</div>
			{/if}
		</div>

		<!-- floating right button -->
		<div
			class="fixed bottom-18 z-10 mx-auto flex w-full max-w-screen-md justify-end pr-4"
		>
			<button
				class="rounded-full bg-blue-500 p-4 text-white shadow-lg hover:bg-blue-600"
				onclick={() => {
					if (!check_login()) return;
					goto('/regi/expert-request');
				}}
			>
				<RiAddLine size={20} color={colors.white} />
			</button>
		</div>
	{/if}
</main>

<Bottom_nav />
