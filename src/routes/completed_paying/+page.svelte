<script>
	const TITLE = '결제요청 완료';

	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	import { comma, copy_to_clipboard, send_data_to_gtm } from '$lib/js/common.js';
	import Header from '$lib/components/ui/Header/+page.svelte';

	import { RiCloseLine } from 'svelte-remixicon';
	import colors from '$lib/js/colors';
</script>

<svelte:head>
	<title>{TITLE} | 설문모아</title>
	<meta name="description" content={TITLE} />
</svelte:head>

<Header>
	<h1 slot="center">{TITLE}</h1>
	<button
		aria-label="닫기"
		slot="right"
		class="flex items-center"
		on:click={async () => {
			await send_data_to_gtm('completed_paying_close');
			goto('/see_more/comissioned_research');
		}}
	>
		<RiCloseLine size={24} color={colors.gray[400]} />
	</button>
</Header>

<main class="flex flex-col items-center justify-center">
	<div class="mt-32 flex flex-col items-center">
		<p class="text-xl font-semibold">국민은행</p>
		<p class="mt-1">예금주 : 이상민</p>
	</div>

	<p class="mt-8 text-xl font-bold">{comma(12000)}원</p>

	<div class="mt-14 flex flex-col items-center">
		<p class="text-xs">입금계좌</p>
	</div>

	<div class="mt-2 w-full">
		<div class="mx-4 flex items-center justify-between rounded-md bg-gray-50 py-3">
			<div class="flex-1"></div>
			<p
				class="text-primary absolute left-1/2 -translate-x-1/2 transform text-lg whitespace-nowrap"
			>
				939302-00-616198
			</p>
			<button
				aria-label="계좌번호 복사"
				class="flex flex-1 justify-end pr-5"
				id="copy_account_btn_ga4"
				on:click={async () => {
					copy_to_clipboard('10430104503406', '계좌번호가 클립보드에 복사되었습니다.');
					await send_data_to_gtm('copy_deposit_account');
				}}
			>
				<svg
					width="35"
					height="35"
					viewBox="0 0 35 35"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<rect x="8" y="6" width="14.3343" height="18.1115" rx="2" fill="#C9DFFF" />
					<rect
						x="12.0957"
						y="10.0254"
						width="14.3343"
						height="18.1115"
						rx="2"
						fill="#237BF8"
						fill-opacity="0.81"
					/>
				</svg>
			</button>
		</div>
	</div>

	<p class="mt-8 text-xs">*24시간내 미입금 시 자동취소</p>
</main>
