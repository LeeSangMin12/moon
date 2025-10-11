<script>
	import { onMount } from 'svelte';

	import Bottom_nav from '$lib/components/ui/Bottom_nav.svelte';
	import Header from '$lib/components/ui/Header.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';

	import colors from '$lib/config/colors';

	const TITLE = '채팅';
</script>

<svelte:head>
	<title>채팅 | 문</title>
	<meta
		name="description"
		content="전문가와 1:1 채팅으로 실시간 소통하세요. 질문하고 답변받는 개인화된 채팅 서비스를 이용해보세요."
	/>
</svelte:head>

<Header>
	<h1 slot="left" class="text-xl font-bold">{TITLE}</h1>

	<div slot="right">
		<button>
			<Icon attribute="search" size={24} color={colors.gray[600]} />
		</button>
	</div>
</Header>

<main class="px-4">
	<a href="/chat/1" class="cursor-pointer py-3">
		<div class="flex items-start">
			<div class="mr-3 h-12 w-12 flex-shrink-0 overflow-hidden rounded-full">
				<img
					src="https://readdy.ai/api/search-image?query=professional%2520asian%2520female%2520headshot%252C%2520tech%2520professional%252C%2520neutral%2520background%252C%2520high%2520quality%2520portrait&width=100&height=100&seq=202&orientation=squarish"
					alt="이서연"
					class="h-full w-full object-cover"
				/>
			</div>
			<div class="min-w-0 flex-1">
				<div class="mb-1 flex items-center justify-between">
					<h3 class="truncate font-medium text-gray-900">이서연</h3>
					<div class="flex items-center">
						<span class="text-xs text-gray-500">오후 2:34</span>

						<div class="ml-2 flex-shrink-0">
							<span
								class="unread-badge bg-primary flex items-center justify-center rounded-full px-1.5 py-0.5 text-xs text-white"
								>3</span
							>
						</div>
					</div>
				</div>
				<p class="mb-1 truncate text-sm text-gray-600">
					Next.js 프로젝트 배포 관련해서 문의드린 내용 확인 부탁드립니다.
				</p>
			</div>
		</div>
	</a>
</main>

<Bottom_nav />
