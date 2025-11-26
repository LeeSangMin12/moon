<script>
	// import { username } from '@/lib/store/users_store.js';
	import colors from '$lib/config/colors';
	import { get_user_context } from '$lib/contexts/app_context.svelte.js';
	import { goto } from '$app/navigation';
	import {
		RiArrowLeftSLine,
		RiArrowRightSLine,
		RiArrowRightWideLine,
		RiBookmarkLine,
		RiCommunityLine,
		RiCupLine,
		RiGraduationCapLine,
		RiHeartLine,
		RiTeamLine,
		RiUserLine,
		RiUserStarLine,
	} from 'svelte-remixicon';

	import Header from '$lib/components/ui/Header.svelte';

	const me = get_user_context();
</script>

<svelte:head>
	<title>더보기 | 문</title>
	<meta
		name="description"
		content="내 프로필, 주문 내역, 좋아요한 서비스, 북마크, 참여 커뮤니티, 이벤트, 공지사항을 확인할 수 있는 문의 더보기 페이지입니다."
	/>
</svelte:head>

<Header>
	<div slot="left">
		<a class="flex items-center" href={`/@${me?.handle}`}>
			<RiArrowLeftSLine size={24} color={colors.gray[600]} />
		</a>
	</div>
</Header>

<main>
	<div class="mx-4 mt-2 flex items-center justify-center">
		<a
			href={`/@${me?.handle}/accounts/point`}
			class="flex h-16 w-full items-center justify-between rounded-[14px] bg-gradient-to-r from-blue-500 to-sky-500 px-7"
		>
			<p class="font-bold text-white">문 포인트</p>
			<p class="flex items-center text-xl font-bold text-white">
				<span>{me?.moon_point} P</span>

				<svg
					class="ml-2 inline-block"
					width="9"
					height="16"
					viewBox="0 0 9 16"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M1 15L8 8L1 1"
						stroke="white"
						stroke-opacity="0.54"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			</p>
		</a>
	</div>

	<p class="flex items-center px-5 pt-6 text-lg font-semibold">나의 활동</p>

	<div class="mt-3 flex flex-col gap-5">
		<a class="flex items-center px-4" href="/@{me?.handle}/accounts/profile">
			<RiUserLine size={20} color={colors.gray[600]} class="mr-3" />

			<p>프로필</p>
		</a>

		<a class="flex items-center px-4" href="/@{me?.handle}/accounts/orders">
			<RiGraduationCapLine size={20} color={colors.gray[600]} class="mr-3" />

			<p>서비스 구매/판매</p>
		</a>

		<a class="flex items-center px-4" href="/expert/accounts">
			<RiUserStarLine size={20} color={colors.gray[600]} class="mr-3" />

			<p>사이드·풀타임 잡 관리</p>
		</a>

		<a class="flex items-center px-4" href="/@{me?.handle}/accounts/like">
			<RiHeartLine size={20} color={colors.gray[600]} class="mr-3" />

			<p>좋아요한 서비스</p>
		</a>

		<a class="flex items-center px-4" href="/@{me?.handle}/accounts/bookmark">
			<RiBookmarkLine size={20} color={colors.gray[600]} class="mr-3" />

			<p>북마크</p>
		</a>

		<a class="flex items-center px-4" href="/@{me?.handle}/accounts/community">
			<RiTeamLine size={20} color={colors.gray[600]} class="mr-3" />

			<p>참여 커뮤니티</p>
		</a>

		<a
			class="flex items-center px-4"
			href="/@{me?.handle}/accounts/coffee-chat"
		>
			<RiCupLine size={20} color={colors.gray[600]} class="mr-3" />

			<p>커피챗</p>
		</a>
	</div>

	<div class="mt-3 h-1 bg-gray-200"></div>

	<p class="flex items-center px-5 pt-6 text-lg font-semibold">
		상담하기 (24시 연중무휴)
	</p>

	<a
		class="flex items-center px-4 pt-4"
		href="https://open.kakao.com/o/sMTQ2HEh"
		target="_blank"
	>
		<p>실시간 카톡 상담</p>
	</a>

	<div class="flex items-center justify-between px-4 pt-4">
		<p>실시간 전화 상담</p>

		<span>070-8018-6194</span>
	</div>

	<div class="mt-3 h-1 bg-gray-200"></div>

	<p class="flex items-center px-4 pt-6 text-lg font-semibold">지원</p>

	<div class="mt-3 flex flex-col gap-5">
		<a class="flex items-center px-4" href="/event">
			<p>이벤트</p>
		</a>

		<a class="flex items-center px-4" href="/@{me?.handle}/accounts/notice">
			<p>공지사항</p>
		</a>

		<a
			class="flex items-center px-4"
			href="/@{me?.handle}/accounts/company-introduction"
		>
			<p>회사소개</p>
		</a>

		<!-- <a class="flex items-center px-5 py-4" href="see_more/terms_of_use">
			<p>이용약관</p>
		</a>

		<a class="flex items-center px-5 py-4" href="see_more/privacy_policy">
			<p>개인정보 처리방침</p>
		</a> -->

		<div class="flex items-center justify-between px-4">
			<p>버전정보</p>

			<span class="text-primary">V.1.4.6</span>
		</div>
	</div>
</main>
