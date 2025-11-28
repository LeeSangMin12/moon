<script>
	import colors from '$lib/config/colors';
	import {
		get_api_context,
		get_user_context,
	} from '$lib/contexts/app_context.svelte.js';
	import { comma, show_toast } from '$lib/utils/common';
	import { smart_go_back } from '$lib/utils/navigation.js';
	import { goto } from '$app/navigation';
	import { RiArrowLeftSLine, RiCheckLine, RiCloseLine } from 'svelte-remixicon';

	import Bottom_nav from '$lib/components/ui/Bottom_nav.svelte';
	import Header from '$lib/components/ui/Header.svelte';

	const me = get_user_context();
	const api = get_api_context();

	let { data } = $props();
	let { pending_requests } = $state(data);

	const TITLE = '사이드·풀타임 잡 관리';

	// 모달 상태
	let show_detail_modal = $state(false);
	let selected_request = $state(null);

	// 상세보기 모달 열기
	const open_detail_modal = (request) => {
		selected_request = request;
		show_detail_modal = true;
	};

	// 모달 닫기
	const close_detail_modal = () => {
		show_detail_modal = false;
		selected_request = null;
	};

	// 승인 처리
	const approve_request = async (request_id) => {
		if (!confirm('입금을 확인하고 이 공고를 승인하시겠습니까?')) {
			return;
		}

		try {
			await api.expert_requests.approve_payment(request_id);
			show_toast('success', '공고가 승인되어 게시되었습니다.');

			// 목록에서 제거
			pending_requests = pending_requests.filter((r) => r.id !== request_id);
		} catch (error) {
			console.error('승인 실패:', error);
			show_toast('error', '승인 처리에 실패했습니다.');
		}
	};

	// 거절 처리
	const reject_request = async (request_id) => {
		const reject_reason = prompt('거절 사유를 입력해주세요 (선택):');
		if (reject_reason === null) {
			// 취소 버튼을 누른 경우
			return;
		}

		if (!confirm('이 공고를 거절하시겠습니까? 거절 후에는 취소할 수 없습니다.')) {
			return;
		}

		try {
			await api.expert_requests.reject_payment(request_id, reject_reason.trim() || null);
			show_toast('success', '공고가 거절되었습니다.');

			// 목록에서 제거
			pending_requests = pending_requests.filter((r) => r.id !== request_id);
		} catch (error) {
			console.error('거절 실패:', error);
			show_toast('error', '거절 처리에 실패했습니다.');
		}
	};

	// 날짜 포맷
	const format_date = (date_string) => {
		return new Date(date_string).toLocaleString('ko-KR', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
		});
	};
</script>

<svelte:head>
	<title>{TITLE} | 문</title>
</svelte:head>

<Header>
	<button slot="left" onclick={smart_go_back}>
		<RiArrowLeftSLine size={24} color={colors.gray[600]} />
	</button>
	<h1 slot="center" class="font-semibold">{TITLE}</h1>
</Header>

<main class="min-h-screen bg-gray-50 px-4 pt-4 pb-20">
	<!-- 통계 카드 -->
	<div class="mb-6 rounded-lg bg-white p-4 shadow-sm">
		<h2 class="mb-2 text-sm font-medium text-gray-600">입금 대기 중</h2>
		<p class="text-3xl font-bold text-blue-600">{pending_requests.length}건</p>
	</div>

	<!-- 입금 대기 목록 -->
	{#if pending_requests.length === 0}
		<div class="py-12 text-center">
			<p class="text-gray-500">입금 대기 중인 공고가 없습니다.</p>
		</div>
	{:else}
		<div class="space-y-4">
			{#each pending_requests as request}
				<div class="rounded-lg border border-gray-200 bg-white p-4">
					<!-- 공고 정보 -->
					<div class="mb-3">
						<div class="mb-1 flex items-start justify-between">
							<h3 class="flex-1 font-semibold text-gray-900">
								{request.title}
							</h3>
							<span
								class="ml-2 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800"
							>
								승인 대기
							</span>
						</div>
						{#if request.category}
							<p class="text-xs text-gray-500">{request.category}</p>
						{/if}
					</div>

					<!-- 의뢰인 정보 -->
					<div class="mb-3 rounded-lg bg-gray-50 p-3">
						<p class="mb-1 text-xs font-medium text-gray-600">의뢰인 정보</p>
						<div class="space-y-1 text-sm">
							<div class="flex justify-between">
								<span class="text-gray-600">이름</span>
								<span class="font-medium"
									>{request.users?.name || request.users?.handle}</span
								>
							</div>
							<div class="flex justify-between">
								<span class="text-gray-600">이메일</span>
								<span class="font-medium">{request.users?.email || '-'}</span>
							</div>
						</div>
					</div>

					<!-- 입금 정보 -->
					<div class="mb-3 rounded-lg bg-blue-50 p-3">
						<p class="mb-2 text-xs font-medium text-blue-900">입금 정보</p>
						<div class="space-y-1 text-sm">
							<div class="flex justify-between">
								<span class="text-blue-700">입금자명</span>
								<span class="font-medium text-blue-900">
									{request.payment_info?.depositor_name || '-'}
								</span>
							</div>
							<div class="flex justify-between">
								<span class="text-blue-700">은행</span>
								<span class="font-medium text-blue-900">
									{request.payment_info?.bank || '-'}
								</span>
							</div>
							<div class="flex justify-between">
								<span class="text-blue-700">계좌번호</span>
								<span class="font-medium text-blue-900">
									{request.payment_info?.account_number || '-'}
								</span>
							</div>
							{#if request.coupon_discount && request.coupon_discount > 0}
								<div class="flex justify-between border-t border-blue-200 pt-2">
									<span class="text-blue-700">등록비</span>
									<span class="text-blue-900">
										₩{comma(request.registration_amount || 4900)}
									</span>
								</div>
								<div class="flex justify-between">
									<span class="text-blue-700">쿠폰 할인</span>
									<span class="text-blue-900">
										-₩{comma(request.coupon_discount)}
									</span>
								</div>
							{/if}
							<div class="flex justify-between border-t border-blue-200 pt-2">
								<span class="font-semibold text-blue-900">최종 입금 금액</span>
								<span class="text-lg font-bold text-blue-600">
									₩{comma(
										(request.registration_amount || 4900) -
											(request.coupon_discount || 0),
									)}
								</span>
							</div>
						</div>
					</div>

					<!-- 공고 세부 정보 -->
					<div class="mb-3 space-y-1 text-sm">
						<div class="flex justify-between">
							<span class="text-gray-600">보상금</span>
							<span class="font-medium">₩{comma(request.reward_amount)}</span>
						</div>
						<div class="flex justify-between">
							<span class="text-gray-600">입금 정보 제출</span>
							<span class="text-xs text-gray-500">
								{format_date(request.registration_paid_at)}
							</span>
						</div>
					</div>

					<!-- 버튼 그룹 -->
					<div class="flex gap-2">
						<button
							onclick={() => open_detail_modal(request)}
							class="btn btn-outline flex-1"
						>
							상세보기
						</button>
						<button
							onclick={() => approve_request(request.id)}
							class="btn btn-primary flex-1"
						>
							<RiCheckLine size={20} />
							승인
						</button>
						<button
							onclick={() => reject_request(request.id)}
							class="btn btn-error"
						>
							<RiCloseLine size={20} />
							거절
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</main>

<!-- 상세보기 모달 -->
{#if show_detail_modal && selected_request}
	<div
		class="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center"
		onclick={close_detail_modal}
	>
		<div
			class="max-h-[90vh] w-full overflow-y-auto rounded-t-2xl bg-white p-6 sm:max-w-2xl sm:rounded-2xl"
			onclick={(e) => e.stopPropagation()}
		>
			<!-- 모달 헤더 -->
			<div class="mb-4 flex items-start justify-between">
				<h2 class="text-xl font-bold text-gray-900">공고 상세 정보</h2>
				<button
					onclick={close_detail_modal}
					class="text-gray-400 hover:text-gray-600"
				>
					<svg
						class="h-6 w-6"
						fill="none"
						stroke="currentColor"
						viewBox="0 0 24 24"
					>
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M6 18L18 6M6 6l12 12"
						/>
					</svg>
				</button>
			</div>

			<!-- 공고 기본 정보 -->
			<div class="space-y-4">
				<div>
					<h3 class="mb-2 text-lg font-semibold text-gray-900">
						{selected_request.title}
					</h3>
					<div class="flex gap-2">
						<span
							class="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800"
						>
							{selected_request.category}
						</span>
						<span
							class="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-800"
						>
							{selected_request.job_type === 'sidejob' ? '사이드잡' : '풀타임'}
						</span>
					</div>
				</div>

				<!-- 공고 설명 -->
				<div>
					<h4 class="mb-2 text-sm font-semibold text-gray-700">공고 설명</h4>
					<div class="rounded-lg bg-gray-50 p-4">
						<div class="prose prose-sm max-w-none text-gray-700">
							{@html selected_request.description}
						</div>
					</div>
				</div>

				<!-- 보상 및 기간 정보 -->
				<div class="grid gap-4 sm:grid-cols-2">
					<div>
						<h4 class="mb-2 text-sm font-semibold text-gray-700">보상금</h4>
						<p class="text-lg font-bold text-blue-600">
							₩{comma(selected_request.reward_amount)}
						</p>
						<p class="text-xs text-gray-500">
							{selected_request.price_unit === 'per_project'
								? '프로젝트당'
								: selected_request.price_unit === 'per_hour'
									? '시간당'
									: '월'}
						</p>
					</div>

					<div>
						<h4 class="mb-2 text-sm font-semibold text-gray-700">
							최대 지원자
						</h4>
						<p class="text-lg font-bold text-gray-900">
							{selected_request.max_applicants}명
						</p>
					</div>
				</div>

				<!-- 날짜 정보 -->
				<div>
					<h4 class="mb-2 text-sm font-semibold text-gray-700">일정</h4>
					<div class="space-y-2 text-sm">
						{#if selected_request.application_deadline}
							<div class="flex justify-between">
								<span class="text-gray-600">지원 마감</span>
								<span class="font-medium"
									>{format_date(selected_request.application_deadline)}</span
								>
							</div>
						{/if}
						{#if selected_request.work_start_date}
							<div class="flex justify-between">
								<span class="text-gray-600">업무 시작</span>
								<span class="font-medium"
									>{format_date(selected_request.work_start_date)}</span
								>
							</div>
						{/if}
						{#if selected_request.work_end_date}
							<div class="flex justify-between">
								<span class="text-gray-600">업무 종료</span>
								<span class="font-medium"
									>{format_date(selected_request.work_end_date)}</span
								>
							</div>
						{/if}
					</div>
				</div>

				<!-- 근무 위치 -->
				{#if selected_request.work_location}
					<div>
						<h4 class="mb-2 text-sm font-semibold text-gray-700">근무 위치</h4>
						<p class="text-gray-900">{selected_request.work_location}</p>
					</div>
				{/if}

				<!-- 등록비 정보 -->
				<div class="rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
					<h4 class="mb-2 text-sm font-semibold text-blue-900">등록비 정보</h4>
					<div class="space-y-1 text-sm">
						<div class="flex justify-between">
							<span class="text-blue-700">등록비</span>
							<span class="font-medium text-blue-900"
								>₩{comma(selected_request.registration_amount || 4900)}</span
							>
						</div>
						{#if selected_request.coupon_discount && selected_request.coupon_discount > 0}
							<div class="flex justify-between">
								<span class="text-blue-700">쿠폰 할인</span>
								<span class="font-medium text-blue-900"
									>-₩{comma(selected_request.coupon_discount)}</span
								>
							</div>
							<div class="flex justify-between border-t border-blue-200 pt-1">
								<span class="font-semibold text-blue-900">최종 입금 금액</span>
								<span class="font-bold text-blue-600"
									>₩{comma(
										(selected_request.registration_amount || 4900) -
											selected_request.coupon_discount,
									)}</span
								>
							</div>
						{/if}
						<div
							class="flex justify-between {selected_request.coupon_discount
								? ''
								: 'border-t border-blue-200 pt-1'}"
						>
							<span class="text-blue-700">입금 제출일</span>
							<span class="font-medium text-blue-900"
								>{format_date(selected_request.registration_paid_at)}</span
							>
						</div>
					</div>
				</div>
			</div>

			<!-- 모달 하단 버튼 -->
			<div class="mt-6 flex gap-3">
				<button
					onclick={close_detail_modal}
					class="btn btn-outline flex-1"
				>
					닫기
				</button>
				<button
					onclick={() => {
						reject_request(selected_request.id);
						close_detail_modal();
					}}
					class="btn btn-error"
				>
					<RiCloseLine size={20} />
					거절
				</button>
				<button
					onclick={() => {
						approve_request(selected_request.id);
						close_detail_modal();
					}}
					class="btn btn-primary flex-1"
				>
					<RiCheckLine size={20} />
					승인
				</button>
			</div>
		</div>
	</div>
{/if}

<Bottom_nav />
