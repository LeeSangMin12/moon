<script>
	import profile_png from '$lib/img/common/user/profile.png';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import {
		RiArrowLeftSLine,
		RiHeartFill,
		RiRemixiconFill,
		RiShareLine,
	} from 'svelte-remixicon';

	import Bottom_nav from '$lib/components/ui/Bottom_nav/+page.svelte';
	import Header from '$lib/components/ui/Header/+page.svelte';
	import Icon from '$lib/components/ui/Icon/+page.svelte';
	import TabSelector from '$lib/components/ui/TabSelector/+page.svelte';
	import Post from '$lib/components/Post/+page.svelte';

	import colors from '$lib/js/colors';

	const TITLE = '문';

	let { data } = $props();
	let { user, follower_count, following_count } = $derived(data);

	let tabs = ['게시글', '댓글', '서비스', '받은리뷰'];
	let selected = $state(0);
</script>

<Header>
	<div slot="left">
		<button class="flex items-center" onclick={() => goto('/')}>
			<RiArrowLeftSLine size={28} color={colors.gray[600]} />
		</button>
	</div>

	<div slot="right">
		<button>
			<Icon attribute="menu" size={24} color={colors.gray[600]} />
		</button>
	</div>
</Header>

<main>
	<!-- 프로필 섹션 -->
	<section class="px-4 py-4">
		<div class="flex items-start">
			<!-- 프로필 이미지 -->
			<div class="mr-4">
				<img
					src={user.avatar_url || profile_png}
					alt="프로필 이미지"
					class="h-16 w-16 rounded-full border-2 border-gray-100 object-cover"
				/>
			</div>
			<!-- 프로필 정보 -->
			<div class="flex-1">
				<h2 class="text-sm text-gray-500">@{user.handle}</h2>
				<h1 class="text-xl font-bold">{user.name}</h1>
				<!-- 별점 -->
				<div class="mt-1 flex items-center">
					<div class="flex items-center text-yellow-500">
						<Icon attribute="star" size={16} color={colors.primary} />
					</div>

					<span class="text-sm font-medium">{user.rating}</span>
					<span class="ml-1 text-sm text-gray-500">
						({user.rating_count || 0})
					</span>
				</div>
			</div>
		</div>
		<!-- 팔로워/팔로잉 정보 -->
		<div class="mt-4 flex space-x-4">
			<div class="cursor-pointer">
				<span class="font-medium">{follower_count}</span>
				<span class="text-sm text-gray-500"> 팔로워</span>
			</div>
			<div class="cursor-pointer">
				<span class="font-medium">{following_count}</span>
				<span class="text-sm text-gray-500"> 팔로잉</span>
			</div>
		</div>
		<!-- 소개글 -->
		<p class="mt-4 text-sm">
			{user.self_introduction}
		</p>
		<!-- 메시지와 팔로우 버튼 -->
		<div class="mt-4 flex space-x-2">
			<button
				class="btn btn-primary flex h-9 flex-1 items-center justify-center"
			>
				팔로우
			</button>
			<button
				class="btn flex h-9 flex-1 items-center justify-center border-none bg-gray-100"
			>
				메시지
			</button>
			<button
				class="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100"
			>
				<RiShareLine />
			</button>
		</div>
	</section>

	<div class="mt-4">
		<TabSelector {tabs} bind:selected />
	</div>

	{#if selected === 2}
		<section>
			<div class="mt-4 grid grid-cols-2 gap-4 px-4">
				<!-- 서비스 카드 1 -->
				<div
					class="overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm"
				>
					<div class="relative">
						<img
							src="https://readdy.ai/api/search-image?query=professional%2520web%2520developer%2520working%2520on%2520React%2520code%252C%2520modern%2520workspace%252C%2520clean%2520desk%2520setup%252C%2520multiple%2520monitors%2520showing%2520code%252C%2520high-quality%2520detailed%2520photo%252C%2520soft%2520lighting&width=400&height=225&seq=101&orientation=landscape"
							alt="React 컴포넌트 최적화"
							class="h-28 w-full object-cover"
						/>
					</div>
					<div class="px-2 py-2">
						<h3 class="line-clamp-2 text-sm/5 font-medium tracking-tight">
							React 컴포넌트 최적화 코드 리뷰
						</h3>

						<div class="mt-1 flex items-center">
							<div class="flex items-center">
								<Icon attribute="star" size={12} color={colors.primary} />
							</div>

							<span class="text-xs font-medium">4.9</span>
							<span class="ml-1 text-xs text-gray-500">(327)</span>
						</div>

						<div class="mt-1.5 flex items-center justify-between">
							<span class="font-semibold text-gray-900">₩50,000</span>

							<button>
								<RiHeartFill size={18} color={colors.gray[400]} />
							</button>
						</div>
					</div>
				</div>
			</div>
		</section>
	{/if}

	<!-- 탭 컨텐츠 -->
	<section>
		<!-- 게시글 탭 -->
		<div class="active tab-content" id="posts-content">
			<div class="border-b border-gray-100 p-4">
				<div class="flex items-start">
					<div class="flex-1">
						<h3 class="font-medium">프론트엔드 개발 팁: React 최적화 방법</h3>
						<p class="mt-1 text-sm text-gray-600">
							React 애플리케이션의 성능을 향상시키는 몇 가지 방법을 공유합니다.
							메모이제이션, 코드 스플리팅, 가상화 등 다양한 기법을 알아보세요.
						</p>
						<div class="mt-2 flex items-center text-xs text-gray-500">
							<span>2025년 6월 10일</span>
							<span class="mx-1">•</span>
							<div class="flex items-center">
								<i class="ri-heart-line ri-sm mr-1"></i>
								<span>124</span>
							</div>
							<span class="mx-1">•</span>
							<div class="flex items-center">
								<i class="ri-message-2-line ri-sm mr-1"></i>
								<span>32</span>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div class="border-b border-gray-100 p-4">
				<div class="flex items-start">
					<div class="flex-1">
						<h3 class="font-medium">타입스크립트 초보자를 위한 가이드</h3>
						<p class="mt-1 text-sm text-gray-600">
							타입스크립트를 처음 시작하는 분들을 위한 기초 가이드입니다. 타입
							정의부터 인터페이스, 제네릭까지 단계별로 설명합니다.
						</p>
						<div class="mt-2 flex items-center text-xs text-gray-500">
							<span>2025년 6월 5일</span>
							<span class="mx-1">•</span>
							<div class="flex items-center">
								<i class="ri-heart-line ri-sm mr-1"></i>
								<span>89</span>
							</div>
							<span class="mx-1">•</span>
							<div class="flex items-center">
								<i class="ri-message-2-line ri-sm mr-1"></i>
								<span>15</span>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div class="border-b border-gray-100 p-4">
				<div class="flex items-start">
					<div class="flex-1">
						<h3 class="font-medium">웹 개발자를 위한 필수 도구 모음</h3>
						<p class="mt-1 text-sm text-gray-600">
							개발 생산성을 높여주는 필수 도구들을 소개합니다. 코드 에디터,
							디버깅 도구, 버전 관리 시스템 등 다양한 도구를 알아보세요.
						</p>
						<div class="mt-2 flex items-center text-xs text-gray-500">
							<span>2025년 5월 28일</span>
							<span class="mx-1">•</span>
							<div class="flex items-center">
								<i class="ri-heart-line ri-sm mr-1"></i>
								<span>156</span>
							</div>
							<span class="mx-1">•</span>
							<div class="flex items-center">
								<i class="ri-message-2-line ri-sm mr-1"></i>
								<span>42</span>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div class="p-4">
				<div class="flex items-start">
					<div class="flex-1">
						<h3 class="font-medium">Node.js와 Express로 RESTful API 만들기</h3>
						<p class="mt-1 text-sm text-gray-600">
							Node.js와 Express 프레임워크를 사용하여 RESTful API를 구축하는
							방법을 단계별로 설명합니다.
						</p>
						<div class="mt-2 flex items-center text-xs text-gray-500">
							<span>2025년 5월 20일</span>
							<span class="mx-1">•</span>
							<div class="flex items-center">
								<i class="ri-heart-line ri-sm mr-1"></i>
								<span>112</span>
							</div>
							<span class="mx-1">•</span>
							<div class="flex items-center">
								<i class="ri-message-2-line ri-sm mr-1"></i>
								<span>28</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
		<!-- 댓글 탭 -->
		<div class="tab-content" id="comments-content">
			<div class="border-b border-gray-100 p-4">
				<div class="flex items-start">
					<div class="flex-1">
						<div class="mb-1 flex items-center text-xs text-gray-500">
							<span>김민수님의 게시글에 댓글</span>
							<span class="mx-1">•</span>
							<span>2025년 6월 11일</span>
						</div>
						<p class="text-sm">
							정말 유용한 정보 감사합니다! 저도 최근에 React 최적화에 관심이
							많았는데 도움이 많이 되었어요.
						</p>
						<div class="mt-2 flex items-center text-xs text-gray-500">
							<div class="flex items-center">
								<i class="ri-heart-line ri-sm mr-1"></i>
								<span>12</span>
							</div>
							<span class="mx-1">•</span>
							<div class="flex items-center">
								<i class="ri-message-2-line ri-sm mr-1"></i>
								<span>3</span>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div class="border-b border-gray-100 p-4">
				<div class="flex items-start">
					<div class="flex-1">
						<div class="mb-1 flex items-center text-xs text-gray-500">
							<span>이지현님의 게시글에 댓글</span>
							<span class="mx-1">•</span>
							<span>2025년 6월 8일</span>
						</div>
						<p class="text-sm">
							타입스크립트 관련 글 잘 봤습니다. 혹시 타입스크립트와 React를 함께
							사용하는 방법에 대한 글도 작성해 주실 수 있을까요?
						</p>
						<div class="mt-2 flex items-center text-xs text-gray-500">
							<div class="flex items-center">
								<i class="ri-heart-line ri-sm mr-1"></i>
								<span>8</span>
							</div>
							<span class="mx-1">•</span>
							<div class="flex items-center">
								<i class="ri-message-2-line ri-sm mr-1"></i>
								<span>1</span>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div class="border-b border-gray-100 p-4">
				<div class="flex items-start">
					<div class="flex-1">
						<div class="mb-1 flex items-center text-xs text-gray-500">
							<span>박준호님의 게시글에 댓글</span>
							<span class="mx-1">•</span>
							<span>2025년 6월 3일</span>
						</div>
						<p class="text-sm">
							Next.js 관련 내용이 정말 도움이 되었습니다. SSR과 SSG의 차이점을
							명확하게 이해할 수 있었어요.
						</p>
						<div class="mt-2 flex items-center text-xs text-gray-500">
							<div class="flex items-center">
								<i class="ri-heart-line ri-sm mr-1"></i>
								<span>15</span>
							</div>
							<span class="mx-1">•</span>
							<div class="flex items-center">
								<i class="ri-message-2-line ri-sm mr-1"></i>
								<span>2</span>
							</div>
						</div>
					</div>
				</div>
			</div>
			<div class="p-4">
				<div class="flex items-start">
					<div class="flex-1">
						<div class="mb-1 flex items-center text-xs text-gray-500">
							<span>최유진님의 게시글에 댓글</span>
							<span class="mx-1">•</span>
							<span>2025년 5월 29일</span>
						</div>
						<p class="text-sm">
							GraphQL 관련 내용이 매우 유익했습니다. REST API와 비교하는 부분이
							특히 도움이 되었어요.
						</p>
						<div class="mt-2 flex items-center text-xs text-gray-500">
							<div class="flex items-center">
								<i class="ri-heart-line ri-sm mr-1"></i>
								<span>10</span>
							</div>
							<span class="mx-1">•</span>
							<div class="flex items-center">
								<i class="ri-message-2-line ri-sm mr-1"></i>
								<span>0</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
		<!-- 서비스 탭 -->
		<div class="tab-content" id="services-content">
			<div class="border-b border-gray-100 p-4">
				<div class="flex">
					<div class="mr-3 h-20 w-20 overflow-hidden rounded-lg">
						<img
							src="https://readdy.ai/api/search-image?query=professional%20web%20development%20service%2C%20coding%20on%20laptop%2C%20website%20design%2C%20programming%20interface%2C%20clean%20modern%20design&width=100&height=100&seq=2&orientation=squarish"
							alt="웹 개발 서비스"
							class="h-full w-full object-cover"
						/>
					</div>
					<div class="flex-1">
						<h3 class="font-medium">웹 프론트엔드 개발</h3>
						<div class="mt-1 flex items-center">
							<div class="flex items-center text-yellow-500">
								<i class="ri-star-fill ri-sm"></i>
							</div>
							<span class="ml-1 text-sm">4.9</span>
							<span class="ml-1 text-xs text-gray-500">(127)</span>
						</div>
						<p class="mt-1 text-sm text-gray-600">
							React, Vue, Angular 등을 활용한 웹 프론트엔드 개발
						</p>
						<p class="text-primary mt-1 font-medium">₩150,000부터</p>
					</div>
				</div>
			</div>
			<div class="border-b border-gray-100 p-4">
				<div class="flex">
					<div class="mr-3 h-20 w-20 overflow-hidden rounded-lg">
						<img
							src="https://readdy.ai/api/search-image?query=mobile%20app%20development%2C%20smartphone%20with%20app%20interface%2C%20coding%20for%20mobile%2C%20UI%20design%20for%20app&width=100&height=100&seq=3&orientation=squarish"
							alt="모바일 앱 개발"
							class="h-full w-full object-cover"
						/>
					</div>
					<div class="flex-1">
						<h3 class="font-medium">모바일 앱 개발</h3>
						<div class="mt-1 flex items-center">
							<div class="flex items-center text-yellow-500">
								<i class="ri-star-fill ri-sm"></i>
							</div>
							<span class="ml-1 text-sm">4.8</span>
							<span class="ml-1 text-xs text-gray-500">(98)</span>
						</div>
						<p class="mt-1 text-sm text-gray-600">
							React Native, Flutter를 활용한 크로스 플랫폼 앱 개발
						</p>
						<p class="text-primary mt-1 font-medium">₩200,000부터</p>
					</div>
				</div>
			</div>
			<div class="p-4">
				<div class="flex">
					<div class="mr-3 h-20 w-20 overflow-hidden rounded-lg">
						<img
							src="https://readdy.ai/api/search-image?query=code%20review%20service%2C%20programmer%20reviewing%20code%2C%20software%20quality%20assurance%2C%20debugging%20process&width=100&height=100&seq=4&orientation=squarish"
							alt="코드 리뷰"
							class="h-full w-full object-cover"
						/>
					</div>
					<div class="flex-1">
						<h3 class="font-medium">코드 리뷰 및 컨설팅</h3>
						<div class="mt-1 flex items-center">
							<div class="flex items-center text-yellow-500">
								<i class="ri-star-fill ri-sm"></i>
							</div>
							<span class="ml-1 text-sm">5.0</span>
							<span class="ml-1 text-xs text-gray-500">(42)</span>
						</div>
						<p class="mt-1 text-sm text-gray-600">
							코드 품질 향상 및 성능 최적화를 위한 전문 리뷰
						</p>
						<p class="text-primary mt-1 font-medium">₩100,000부터</p>
					</div>
				</div>
			</div>
		</div>
		<!-- 받은리뷰 탭 -->
		<div class="tab-content" id="reviews-content">
			<div class="border-b border-gray-100 p-4">
				<div class="flex items-start">
					<img
						src="https://readdy.ai/api/search-image?query=professional%20portrait%20of%20Korean%20woman%2C%20business%20casual%2C%20friendly%20smile%2C%20neutral%20background&width=40&height=40&seq=5&orientation=squarish"
						alt="리뷰어 이미지"
						class="mr-3 h-10 w-10 rounded-full"
					/>
					<div class="flex-1">
						<div class="flex items-center justify-between">
							<h3 class="font-medium">김지영</h3>
							<span class="text-xs text-gray-500">2025년 6월 8일</span>
						</div>
						<div class="mt-1 flex items-center text-yellow-500">
							<i class="ri-star-fill ri-sm"></i>
							<i class="ri-star-fill ri-sm"></i>
							<i class="ri-star-fill ri-sm"></i>
							<i class="ri-star-fill ri-sm"></i>
							<i class="ri-star-fill ri-sm"></i>
						</div>
						<p class="mt-1 text-sm">
							프론트엔드 개발 서비스를 이용했는데 정말 만족스러웠습니다.
							요구사항을 정확히 이해하고 기대 이상의 결과물을 제공해 주셨어요.
							특히 사용자 경험을 고려한 디자인이 인상적이었습니다.
						</p>
					</div>
				</div>
			</div>
			<div class="border-b border-gray-100 p-4">
				<div class="flex items-start">
					<img
						src="https://readdy.ai/api/search-image?query=professional%20portrait%20of%20Korean%20man%2C%20business%20casual%2C%20confident%20pose%2C%20neutral%20background&width=40&height=40&seq=6&orientation=squarish"
						alt="리뷰어 이미지"
						class="mr-3 h-10 w-10 rounded-full"
					/>
					<div class="flex-1">
						<div class="flex items-center justify-between">
							<h3 class="font-medium">박현우</h3>
							<span class="text-xs text-gray-500">2025년 5월 25일</span>
						</div>
						<div class="mt-1 flex items-center text-yellow-500">
							<i class="ri-star-fill ri-sm"></i>
							<i class="ri-star-fill ri-sm"></i>
							<i class="ri-star-fill ri-sm"></i>
							<i class="ri-star-fill ri-sm"></i>
							<i class="ri-star-fill ri-sm"></i>
						</div>
						<p class="mt-1 text-sm">
							코드 리뷰 서비스를 받았는데, 정말 많은 도움이 되었습니다. 제가
							놓친 부분들을 꼼꼼하게 체크해주시고, 성능 최적화에 대한 조언도
							매우 유익했습니다. 덕분에 코드 품질이 크게 향상되었어요.
						</p>
					</div>
				</div>
			</div>
			<div class="border-b border-gray-100 p-4">
				<div class="flex items-start">
					<img
						src="https://readdy.ai/api/search-image?query=professional%20portrait%20of%20Korean%20woman%2C%20tech%20professional%2C%20smart%20casual%2C%20neutral%20background&width=40&height=40&seq=7&orientation=squarish"
						alt="리뷰어 이미지"
						class="mr-3 h-10 w-10 rounded-full"
					/>
					<div class="flex-1">
						<div class="flex items-center justify-between">
							<h3 class="font-medium">이수진</h3>
							<span class="text-xs text-gray-500">2025년 5월 12일</span>
						</div>
						<div class="mt-1 flex items-center text-yellow-500">
							<i class="ri-star-fill ri-sm"></i>
							<i class="ri-star-fill ri-sm"></i>
							<i class="ri-star-fill ri-sm"></i>
							<i class="ri-star-fill ri-sm"></i>
							<i class="ri-star-half-line ri-sm"></i>
						</div>
						<p class="mt-1 text-sm">
							모바일 앱 개발 서비스를 이용했습니다. 전반적으로 만족스러웠으나,
							초기 요구사항 정의 과정에서 조금 더 명확한 커뮤니케이션이 있었으면
							좋았을 것 같습니다. 그래도 최종 결과물은 훌륭했고, 특히 UI/UX가
							매우 직관적이고 사용하기 편했습니다.
						</p>
					</div>
				</div>
			</div>
			<div class="p-4">
				<div class="flex items-start">
					<img
						src="https://readdy.ai/api/search-image?query=professional%20portrait%20of%20Korean%20man%2C%20tech%20entrepreneur%2C%20modern%20outfit%2C%20neutral%20background&width=40&height=40&seq=8&orientation=squarish"
						alt="리뷰어 이미지"
						class="mr-3 h-10 w-10 rounded-full"
					/>
					<div class="flex-1">
						<div class="flex items-center justify-between">
							<h3 class="font-medium">최동현</h3>
							<span class="text-xs text-gray-500">2025년 4월 30일</span>
						</div>
						<div class="mt-1 flex items-center text-yellow-500">
							<i class="ri-star-fill ri-sm"></i>
							<i class="ri-star-fill ri-sm"></i>
							<i class="ri-star-fill ri-sm"></i>
							<i class="ri-star-fill ri-sm"></i>
							<i class="ri-star-fill ri-sm"></i>
						</div>
						<p class="mt-1 text-sm">
							웹 프론트엔드 개발 서비스를 이용했는데, 정말 전문적인 지식과
							기술력을 갖추고 계신 것 같습니다. 특히 React와 TypeScript를 활용한
							코드 구조가 매우 체계적이고 유지보수하기 좋았습니다. 다음에도 꼭
							함께 일하고 싶습니다.
						</p>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- <Post /> -->
</main>

<Bottom_nav />
