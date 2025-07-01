<script>
	// import { username } from '@/lib/store/users_store.js';
	import { goto } from '$app/navigation';
	import { RiArrowRightSLine } from 'svelte-remixicon';

	import Header from '$lib/components/ui/Header/+page.svelte';

	import colors from '$lib/js/colors';
	import { user_store } from '$lib/store/user_store';

	const TITLE = '더보기';
</script>

<svelte:head>
	<title>{TITLE} | 설문모아</title>
	<meta name="description" content={TITLE} />
</svelte:head>

<Header>
	<div slot="left">
		<a class="flex items-center" href="see_more/modify_membership">
			<h1 class="mr-1.5 font-semibold">{$user_store.name}님</h1>

			<RiArrowRightSLine size={24} color={colors.gray[600]} />
		</a>
	</div>
</Header>

<main>
	<button class="flex items-center px-5 py-4">
		<svg
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			class="mr-3"
		>
			<path
				fill-rule="evenodd"
				clip-rule="evenodd"
				d="M19 4C20.6569 4 22 5.34315 22 7V7.33388L12.4819 12.5688C12.1818 12.7338 11.8182 12.7338 11.5181 12.5688L2 7.33388V7C2 5.34315 3.34315 4 5 4H19ZM2 9.66622V17C2 18.6569 3.34315 20 5 20H19C20.6569 20 22 18.6569 22 17V9.66622L12.5613 14.8575C12.2158 15.0475 11.7842 15.0475 11.4387 14.8575L2 9.66622Z"
				fill="#5F636E"
			/>
		</svg>

		<p>추천하기</p>
	</button>

	<button class="flex items-center px-5 py-4">
		<svg
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			class="mr-3"
		>
			<g clip-path="url(#clip0_3013_6517)">
				<path
					fill-rule="evenodd"
					clip-rule="evenodd"
					d="M6.66667 4C5.19391 4 4 5.19391 4 6.66667V17.3333C4 18.8061 5.19391 20 6.66667 20H17.3333C18.8061 20 20 18.8061 20 17.3333V14.6667H15.5556C14.0828 14.6667 12.8889 13.4728 12.8889 12C12.8889 10.5272 14.0828 9.33333 15.5556 9.33333H20V6.66667C20 5.19391 18.8061 4 17.3333 4H6.66667Z"
					fill="#5F636E"
					stroke="#5F636E"
					stroke-width="2"
				/>
			</g>
			<defs>
				<clipPath id="clip0_3013_6517">
					<rect width="24" height="24" fill="white" />
				</clipPath>
			</defs>
		</svg>

		<p>계좌정보</p>
	</button>

	<div class="h-2 bg-gray-200" />

	<p class="flex items-center px-5 py-4 text-lg font-semibold">나의 설문조사</p>

	<button class="flex items-center px-5 py-4">
		<svg
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			class="mr-3"
		>
			<rect
				x="3"
				y="3"
				width="18"
				height="18"
				rx="9"
				fill="#5F636E"
				stroke="#5F636E"
				stroke-width="2"
			/>
			<path
				d="M15.9492 9L11.2227 15.4453L8 11.793"
				stroke="#F6F8F9"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			/>
		</svg>

		<p>참여한 조사</p>
	</button>

	<button class="flex items-center px-5 py-4">
		<svg
			width="24"
			height="24"
			viewBox="0 0 24 24"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			class="mr-3"
		>
			<rect
				x="5"
				y="4"
				width="14"
				height="16"
				rx="3"
				fill="#5F636E"
				stroke="#5F636E"
				stroke-width="2"
			/>
			<path
				d="M8 9H16"
				stroke="white"
				stroke-width="2"
				stroke-linecap="round"
			/>
			<path
				d="M8 14H14"
				stroke="white"
				stroke-width="2"
				stroke-linecap="round"
			/>
		</svg>

		<p>의뢰한 조사</p>
	</button>

	<div class="h-2 bg-gray-200" />

	<p class="flex items-center px-5 py-4 text-lg font-semibold">지원</p>

	<a class="flex items-center px-5 py-4" href="see_more/event">
		<p>이벤트</p>
	</a>

	<a class="flex items-center px-5 py-4" href="see_more/notice">
		<p>공지사항</p>
	</a>
	<a class="flex items-center px-5 py-4" href="see_more/terms_of_use">
		<p>이용약관</p>
	</a>

	<a class="flex items-center px-5 py-4" href="see_more/privacy_policy">
		<p>개인정보 처리방침</p>
	</a>

	<a class="flex items-center px-5 py-4" href="see_more/company_introduction">
		<p>회사소개</p>
	</a>

	<div class="flex items-center justify-between px-5 py-4">
		<p>버전정보</p>

		<span class="text-primary">V.1.4.6</span>
	</div>

	<div class="h-2 bg-gray-200" />

	<a class="flex items-center px-5 py-4" href="http://pf.kakao.com/_ypnXG/chat">
		<p>카카오톡 문의</p>
	</a>
</main>
