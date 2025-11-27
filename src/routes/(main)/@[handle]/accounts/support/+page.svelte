<script>
	import colors from '$lib/config/colors';
	import {
		RiArrowLeftSLine,
		RiArrowRightSLine,
		RiChat1Line,
		RiPhoneFill,
	} from 'svelte-remixicon';

	import Header from '$lib/components/ui/Header.svelte';

	const PHONE_NUMBER = '070-8018-6194';
	const KAKAO_CHANNEL_URL = 'https://open.kakao.com/o/sMTQ2HEh';

	function handle_call() {
		window.location.href = `tel:${PHONE_NUMBER.replace(/-/g, '')}`;
	}
</script>

<svelte:head>
	<title>고객센터 | 문</title>
	<meta
		name="description"
		content="문의 고객센터 페이지입니다. 카카오톡 또는 전화로 상담받으세요."
	/>
</svelte:head>

<Header>
	<button slot="left" class="flex items-center" onclick={() => history.back()}>
		<RiArrowLeftSLine size={24} color={colors.gray[600]} />
	</button>
	<h1 slot="center" class="text-lg font-semibold">고객센터</h1>
</Header>

<main class="min-h-screen pb-20">
	<div class="px-4 py-6">
		<p class="text-center text-gray-600">
			무엇이든 궁금한 점이 있으시면<br />편하게 문의해 주세요.
		</p>
	</div>

	<div class="bg-white">
		<a
			href={KAKAO_CHANNEL_URL}
			target="_blank"
			rel="noopener noreferrer"
			class="flex items-center justify-between px-4 py-4 transition hover:bg-gray-50"
		>
			<div class="flex items-center">
				<div
					class="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#FEE500]"
				>
					<RiChat1Line size={24} color="#3C1E1E" />
				</div>
				<div>
					<p class="font-medium text-gray-900">카카오톡 상담</p>
					<p class="text-sm text-gray-500">평일 10:00 - 18:00</p>
				</div>
			</div>
			<RiArrowRightSLine size={20} color={colors.gray[400]} />
		</a>

		<button
			onclick={handle_call}
			class="flex w-full items-center justify-between px-4 py-4 text-left transition hover:bg-gray-50"
		>
			<div class="flex items-center">
				<div
					class="mr-3 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100"
				>
					<RiPhoneFill size={22} color={colors.primary} />
				</div>
				<div>
					<p class="font-medium text-gray-900">전화 상담</p>
					<p class="text-sm text-gray-500">{PHONE_NUMBER}</p>
				</div>
			</div>
			<RiArrowRightSLine size={20} color={colors.gray[400]} />
		</button>
	</div>

	<div class="mt-6 px-4">
		<p class="text-center text-xs text-gray-400">
			운영시간: 24시 연중무휴
			<!-- 운영시간: 평일 오전 10시 ~ 오후 6시<br /> -->
			<!-- (점심시간 12:00 - 13:00 / 주말, 공휴일 휴무) -->
		</p>
	</div>
</main>
