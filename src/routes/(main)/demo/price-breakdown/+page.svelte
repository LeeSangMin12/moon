<script>
	import ServiceProposal from '$lib/components/ServiceProposal.svelte';
	import Header from '$lib/components/ui/Header.svelte';
	import { RiArrowLeftSLine, RiStarFill, RiHeartFill } from 'svelte-remixicon';
	import colors from '$lib/config/colors';
	import { smart_go_back } from '$lib/utils/navigation';
	import { comma } from '$lib/utils/common';
	import profile_png from '$lib/img/common/user/profile.png';

	// 서비스 데이터 (실제 스크린샷 참고)
	const service = {
		title: '비밀 유지 계약을 포함한\n요구 사항 정의서',
		subtitle: '비밀유지계약(NDA)를 포함한, 스타트업 맞춤형 요구사항 정의서 제작',
		price: 49000,
		rating: 5,
		rating_count: 1,
		seller: {
			handle: 'moon_expert',
			name: '이상민',
			avatar: profile_png
		}
	};

	// 제안서 데이터
	const proposal = {
		steps: [
			{
				title: '결제 완료',
				description: '결제 확인 후 작업을 시작합니다'
			},
			{
				title: '사전 정보 작성',
				description: '간단한 질문지를 통해 서비스 방향을 파악합니다'
			},
			{
				title: '미팅 (1~2시간)',
				description: '화상 또는 대면으로 상세 요구사항을 협의합니다'
			},
			{
				title: '요구사항 정의서 작성',
				description: '협의 내용을 바탕으로 문서를 작성합니다'
			},
			{
				title: '피드백 반영',
				description: '검토 후 수정사항을 반영합니다'
			},
			{
				title: '최종본 전달',
				description: '완성된 정의서를 전달드립니다'
			}
		],
		deliverables: [
			'비밀유지계약서 (NDA)',
			'요구사항 정의서 (7개 시트)',
			'작성 가이드 및 참고 예시'
		],
		price: 49000,
		duration: '4~5일',
		includes: [
			'NDA 체결',
			'1회 수정',
			'1달간 보완'
		]
	};
</script>

<svelte:head>
	<title>서비스 제안서 UI 데모 | 문</title>
</svelte:head>

<Header>
	<button slot="left" onclick={smart_go_back}>
		<RiArrowLeftSLine size={24} color={colors.gray[600]} />
	</button>
	<h1 slot="center" class="font-semibold">서비스</h1>
</Header>

<main class="pb-24">
	<!-- 서비스 이미지 (임시) -->
	<div class="bg-gray-100 aspect-[4/3] flex items-center justify-center">
		<div class="text-center text-gray-400">
			<svg class="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
			</svg>
			<p class="text-sm">서비스 이미지</p>
		</div>
	</div>

	<div class="px-4 pt-6">
		<!-- 판매자 정보 -->
		<a href="#" class="flex items-center mb-3">
			<img
				src={service.seller.avatar}
				alt={service.seller.name}
				class="w-8 h-8 rounded-full object-cover mr-2"
			/>
			<span class="text-sm font-medium text-gray-700">@{service.seller.handle}</span>
		</a>

		<!-- 서비스 제목 -->
		<h1 class="text-lg font-semibold text-gray-900 mb-1">{service.subtitle}</h1>

		<!-- 별점 -->
		<div class="flex items-center mb-4">
			<RiStarFill size={14} color={colors.primary} />
			<span class="ml-1 text-sm text-gray-500">{service.rating} ({service.rating_count})</span>
		</div>

		<!-- 가격 -->
		<p class="text-xl font-bold text-primary mb-6">₩{comma(service.price)}</p>

		<!-- 서비스 설명 (기존 스타일) -->
		<div class="prose prose-sm max-w-none mb-8">
			<p class="text-gray-700 leading-relaxed">
				창업 초기, 아이디어를 남에게 말하기조차 불안하신가요?<br/>
				하지만 아이디어가 <strong>정의되지 않으면 개발은 절대 시작할 수 없습니다.</strong>
			</p>
			<p class="text-gray-700 leading-relaxed mt-3">
				저는 프로젝트 시작 전 <strong>비밀유지계약(NDA)</strong>을 체결하고,<br/>
				당신의 아이디어를 보호하며 요구사항 정의서를 함께 작성해드립니다.
			</p>
		</div>

		<!-- 이런 분께 추천드립니다 (기존 스타일) -->
		<div class="mb-8">
			<h2 class="text-base font-bold text-gray-900 mb-4">1. 이런 분께 추천드립니다</h2>

			<div class="space-y-4">
				<div>
					<p class="font-medium text-gray-900">1. 예비창업 패키지 지원 사업계획서 작성 하시는분</p>
					<p class="text-sm text-gray-500 mt-1">=> 그냥 아이디어만 제출하는 것보다 첨부서류에 요구사항 정의서를 올리면 신뢰도가 올라갑니다.</p>
				</div>
				<div>
					<p class="font-medium text-gray-900">2. 외주 견적을 받았는데 제안이 제각각이에요.</p>
					<p class="text-sm text-gray-500 mt-1">=> 객관적 요구사항 정의서를 기준으로 통일</p>
				</div>
				<div>
					<p class="font-medium text-gray-900">3. 아이디어는 있는데 어떻게 정리해야 할지 모르겠어요</p>
					<p class="text-sm text-gray-500 mt-1">=> 핵심 기능 구조부터 단계별로 구체화</p>
				</div>
			</div>
		</div>

		<!-- ✅ 새로 추가: 서비스 제안서/견적 컴포넌트 -->
		<div class="mb-8">
			<h2 class="text-base font-bold text-gray-900 mb-4">2. 서비스 진행 안내</h2>

			<ServiceProposal
				steps={proposal.steps}
				deliverables={proposal.deliverables}
				price={proposal.price}
				duration={proposal.duration}
				includes={proposal.includes}
			/>
		</div>

		<!-- FAQ (기존 스타일) -->
		<div class="mb-8">
			<h2 class="text-base font-bold text-gray-900 mb-4">3. FAQ (자주 묻는 질문들)</h2>

			<div class="space-y-4">
				<div class="bg-gray-50 rounded-lg p-4">
					<p class="font-medium text-gray-900 mb-2">질문: 외주 개발 경험이 없는데도 제대로 정의해 주실 수 있나요?</p>
					<p class="text-sm text-gray-600">답변: 물론입니다. IT 비전공자 분들과도 여러 번 작업해왔고, 모르는 개념은 제가 설명드리면서 같이 정의해 나갑니다.</p>
				</div>
				<div class="bg-gray-50 rounded-lg p-4">
					<p class="font-medium text-gray-900 mb-2">질문: 작업 기간은 얼마나 걸리나요?</p>
					<p class="text-sm text-gray-600">답변: 미팅 후 보통 2~3일 내 초안 전달, 피드백 반영 후 최종본까지 총 4~5일 예상됩니다. 급하시면 조율 가능합니다!</p>
				</div>
			</div>
		</div>
	</div>

	<!-- 하단 버튼 -->
	<div class="fixed bottom-0 w-full max-w-screen-md bg-white px-4 py-3.5 border-t border-gray-100">
		<div class="pb-safe flex space-x-2">
			<button class="btn btn-primary flex-1 h-11">
				구매하기
			</button>
			<button class="btn bg-gray-100 border-none flex-1 h-11">
				문의하기
			</button>
			<button class="flex h-11 w-11 items-center justify-center rounded-lg bg-gray-100">
				<RiHeartFill size={20} color={colors.gray[400]} />
			</button>
		</div>
	</div>
</main>
