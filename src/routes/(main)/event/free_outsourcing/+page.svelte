<script>
	import colors from '$lib/config/colors';
	import { copy_to_clipboard } from '$lib/utils/common';
	import { goto } from '$app/navigation';
	import { RiArrowLeftSLine } from 'svelte-remixicon';

	import Header from '$lib/components/ui/Header.svelte';

	const COUPON_CODE = 'JOBFREE';

	// 개발 모드 토글 (URL에 ?dev=true 추가하면 버튼 위치 확인 가능)
	let dev_mode = $state(false);

	$effect(() => {
		if (typeof window !== 'undefined') {
			const params = new URLSearchParams(window.location.search);
			dev_mode = params.get('dev') === 'true';
		}
	});

	const copy_coupon = () => {
		copy_to_clipboard(COUPON_CODE, '쿠폰 코드가 복사되었습니다!');
	};

	const go_to_service = () => {
		goto('/service');
	};
</script>

<svelte:head>
	<title>문 외주 무료 등록 쿠폰 이벤트 | 문</title>
	<meta name="description" content="문 외주 무료 등록 쿠폰을 받아보세요!" />
</svelte:head>

<Header>
	<button slot="left" onclick={() => goto('/event')}>
		<RiArrowLeftSLine size={26} color={colors.gray[600]} />
	</button>
	<h1 slot="center" class="font-semibold">문 외주 무료 등록 쿠폰 이벤트</h1>
</Header>

<div class="relative mx-auto max-w-screen-md bg-white">
	<!-- 이벤트 이미지 -->
	<div class="relative">
		<enhanced:img
			src="./event.png"
			alt="문 외주 무료 등록 쿠폰 이벤트"
			class="block w-full"
		/>

		<!-- 쿠폰 코드 복사 버튼 (투명 오버레이) -->
		<!-- WELCOME5000 텍스트 영역 위에 배치 -->
		<button
			onclick={copy_coupon}
			class="absolute top-[47%] left-[10%] h-[2.4%] w-[80%] cursor-pointer transition-all hover:bg-black/5 {dev_mode
				? 'border-2 border-dashed border-red-500 bg-red-500/20'
				: ''}"
			aria-label="쿠폰 코드 복사"
		>
			{#if dev_mode}
				<span class="text-xs font-bold text-red-600">쿠폰 복사</span>
			{/if}
		</button>

		<button
			onclick={() => {
				goto('/service');
			}}
			class="btn btn-primary h-16 w-full rounded-none text-lg font-semibold"
		>
			<span>혜택 받으러 가기</span>
		</button>
	</div>
</div>
