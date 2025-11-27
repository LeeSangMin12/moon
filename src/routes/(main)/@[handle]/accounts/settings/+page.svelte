<script>
	import colors from '$lib/config/colors';
	import { get_user_context } from '$lib/contexts/app_context.svelte.js';
	import {
		RiArrowLeftSLine,
		RiArrowRightSLine,
		RiInformationLine,
		RiMegaphoneLine,
		RiBuilding2Line
	} from 'svelte-remixicon';

	import Header from '$lib/components/ui/Header.svelte';

	const me = get_user_context();
	const APP_VERSION = '0.0.1';
</script>

<svelte:head>
	<title>설정 | 문</title>
	<meta name="description" content="문의 설정 페이지입니다." />
</svelte:head>

<Header>
	<button slot="left" class="flex items-center" onclick={() => history.back()}>
		<RiArrowLeftSLine size={24} color={colors.gray[600]} />
	</button>
	<h1 slot="center" class="text-lg font-semibold">설정</h1>
</Header>

<main class="min-h-screen bg-gray-50 pb-20">
	<div class="mt-2 bg-white">
		<a
			href={`/@${me?.handle}/accounts/notice`}
			class="flex items-center justify-between px-4 py-4 transition hover:bg-gray-50"
		>
			<div class="flex items-center">
				<RiMegaphoneLine size={22} color={colors.gray[600]} class="mr-3" />
				<span>공지사항</span>
			</div>
			<RiArrowRightSLine size={20} color={colors.gray[400]} />
		</a>

		<a
			href={`/@${me?.handle}/accounts/company-introduction`}
			class="flex items-center justify-between px-4 py-4 transition hover:bg-gray-50"
		>
			<div class="flex items-center">
				<RiBuilding2Line size={22} color={colors.gray[600]} class="mr-3" />
				<span>회사소개</span>
			</div>
			<RiArrowRightSLine size={20} color={colors.gray[400]} />
		</a>

		<div class="flex items-center justify-between px-4 py-4">
			<div class="flex items-center">
				<RiInformationLine size={22} color={colors.gray[600]} class="mr-3" />
				<span>버전정보</span>
			</div>
			<span class="text-sm text-gray-500">v{APP_VERSION}</span>
		</div>
	</div>
</main>
