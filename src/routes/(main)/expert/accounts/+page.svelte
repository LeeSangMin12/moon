<script>
	import {
		ERROR_MESSAGES,
		formatBudget,
		formatDeadlineRelative,
		getProposalStatusDisplay,
		getRequestStatusDisplay,
		SUCCESS_MESSAGES,
	} from '$lib/utils/expert-request-utils';
	import { smartGoBack } from '$lib/utils/navigation';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import {
		RiArrowLeftSLine,
		RiCheckLine,
		RiCloseLine,
		RiEyeLine,
		RiFileTextLine,
		RiUserLine,
	} from 'svelte-remixicon';

	import Bottom_nav from '$lib/components/ui/Bottom_nav/+page.svelte';
	import Header from '$lib/components/ui/Header/+page.svelte';
	import Modal from '$lib/components/ui/Modal/+page.svelte';
	import TabSelector from '$lib/components/ui/TabSelector/+page.svelte';
	import StarRating from '$lib/components/ui/StarRating/+page.svelte';

	import colors from '$lib/js/colors';
	import { comma, show_toast } from '$lib/js/common';
	import { get_user_context, get_api_context } from '$lib/contexts/app-context.svelte.js';

	const { me } = get_user_context();
	const { api } = get_api_context();

	let { data } = $props();
	let { user, my_requests, my_proposals, review_data } = $state(data);

	// 탭 관련 상태
	let tabs = ['요청한 서비스', '제안한 서비스'];
	let selected_tab = $state(0);

	// 통계 계산
	let request_stats = $derived({
		total: my_requests.length,
		open: my_requests.filter((r) => r.status === 'open').length,
		in_progress: my_requests.filter((r) => r.status === 'in_progress').length,
		completed: my_requests.filter((r) => r.status === 'completed').length,
	});

	let proposal_stats = $derived({
		total: my_proposals.length,
		pending: my_proposals.filter((p) => p.status === 'pending').length,
		accepted: my_proposals.filter((p) => p.status === 'accepted').length,
		rejected: my_proposals.filter((p) => p.status === 'rejected').length,
	});

	const refresh_data = async () => {
		try {
			my_requests = await api.expert_requests.select_by_requester_id(
				user.id,
			);
			my_proposals =
				await api.expert_request_proposals.select_by_expert_id(user.id);

			// 리뷰 데이터도 새로고침
			review_data = {};
			for (const request of my_requests) {
				if (request.status === 'completed') {
					const review_permission =
						await api.expert_request_reviews.can_write_review(
							request.id,
							user.id,
						);
					const my_review =
						await api.expert_request_reviews.select_by_request_and_reviewer(
							request.id,
							user.id,
						);
					review_data[request.id] = {
						can_write: review_permission.can_write,
						proposal_id: review_permission.proposal_id,
						expert_id: review_permission.expert_id,
						my_review,
					};
				}
			}

			show_toast('success', '데이터가 새로고침되었습니다.');
		} catch (error) {
			console.error('Refresh error:', error);
			show_toast('error', '데이터 새로고침 중 오류가 발생했습니다.');
		}
	};

	// 프로젝트 완료 처리
	const complete_project = async (request_id, event) => {
		// 이벤트 버블링 방지 (카드 클릭과 분리)
		event?.stopPropagation();

		if (!confirm('프로젝트를 완료하시겠습니까?')) {
			return;
		}

		try {
			await api.expert_requests.complete_project(request_id);
			show_toast('success', SUCCESS_MESSAGES.PROJECT_COMPLETED);

			// 데이터 새로고침
			await refresh_data();
		} catch (error) {
			console.error('Project completion error:', error);

			let errorMessage = ERROR_MESSAGES.SERVER_ERROR;

			if (error.message.includes('Only the requester')) {
				errorMessage = ERROR_MESSAGES.UNAUTHORIZED;
			} else if (error.message.includes('not in progress')) {
				errorMessage = ERROR_MESSAGES.INVALID_STATUS;
			}

			show_toast('error', errorMessage);
		}
	};

	// 리뷰 모달 상태
	let show_review_modal = $state(false);
	let current_review_request = $state(null);
	let review_form = $state({
		rating: 0,
		title: '',
		content: '',
	});
	let is_submitting_review = $state(false);

	// 리뷰 모달 열기
	const open_review_modal = (request, event) => {
		event?.stopPropagation();
		current_review_request = request;
		show_review_modal = true;
		review_form = {
			rating: 0,
			title: '',
			content: '',
		};
	};

	// 리뷰 모달 닫기
	const close_review_modal = () => {
		show_review_modal = false;
		current_review_request = null;
		review_form = {
			rating: 0,
			title: '',
			content: '',
		};
	};

	// 리뷰 제출
	const handle_review_submit = async () => {
		if (is_submitting_review) return;

		// 유효성 검사
		if (review_form.rating === 0) {
			show_toast('error', '별점을 선택해주세요.');
			return;
		}
		if (!review_form.title.trim()) {
			show_toast('error', '리뷰 제목을 입력해주세요.');
			return;
		}
		if (!review_form.content.trim()) {
			show_toast('error', '리뷰 내용을 입력해주세요.');
			return;
		}

		const request_review_data = review_data[current_review_request.id];
		if (!request_review_data || !request_review_data.can_write) {
			show_toast('error', '리뷰를 작성할 수 없습니다.');
			return;
		}

		is_submitting_review = true;

		try {
			// 리뷰 데이터 생성
			const review_data_to_insert = {
				request_id: current_review_request.id,
				proposal_id: request_review_data.proposal_id,
				reviewer_id: user.id,
				expert_id: request_review_data.expert_id,
				rating: review_form.rating,
				title: review_form.title.trim(),
				content: review_form.content.trim(),
			};

			await api.expert_request_reviews.insert(review_data_to_insert);

			// 전문가에게 알림 전송
			await api.notifications.insert({
				recipient_id: request_review_data.expert_id,
				actor_id: user.id,
				type: 'expert_review.created',
				resource_type: 'expert_request',
				resource_id: String(current_review_request.id),
				payload: {
					request_id: current_review_request.id,
					request_title: current_review_request.title,
					rating: review_form.rating,
					title: review_form.title,
				},
				link_url: `/expert-request/${current_review_request.id}`,
			});

			show_toast('success', '리뷰가 성공적으로 작성되었습니다.');
			close_review_modal();

			// 데이터 새로고침
			await refresh_data();
		} catch (error) {
			console.error('Review submission error:', error);
			show_toast('error', '리뷰 작성 중 오류가 발생했습니다.');
		} finally {
			is_submitting_review = false;
		}
	};
</script>

<svelte:head>
	<title>전문가 서비스 계정 | 문</title>
	<meta
		name="description"
		content="내가 요청하고 제안한 전문가 서비스들을 관리하세요."
	/>
</svelte:head>

<Header>
	<button slot="left" onclick={smartGoBack}>
		<RiArrowLeftSLine size={28} color={colors.gray[600]} />
	</button>
	<h1 slot="center" class="font-semibold">전문가 서비스 계정</h1>
</Header>

<main class="min-h-screen bg-gray-50 pb-20">
	<!-- 탭 선택기 -->
	<div class="bg-white px-4 py-4">
		<TabSelector {tabs} bind:selected={selected_tab} />
	</div>

	<!-- 탭 1: 요청한 서비스 -->
	{#if selected_tab === 0}
		<div class="mt-4 px-4">
			<!-- 통계 카드 -->
			<div class="mb-6 rounded-xl border border-gray-100 bg-white p-6">
				<h3 class="mb-4 text-lg font-semibold text-gray-900">내 요청 현황</h3>
				<div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
					<div class="text-center">
						<div class="text-2xl font-bold text-gray-900">
							{request_stats.total}
						</div>
						<div class="text-sm text-gray-500">전체</div>
					</div>
					<div class="text-center">
						<div class="text-2xl font-bold text-emerald-600">
							{request_stats.open}
						</div>
						<div class="text-sm text-gray-500">모집중</div>
					</div>
					<div class="text-center">
						<div class="text-2xl font-bold text-amber-600">
							{request_stats.in_progress}
						</div>
						<div class="text-sm text-gray-500">진행중</div>
					</div>
					<div class="text-center">
						<div class="text-2xl font-bold text-gray-600">
							{request_stats.completed}
						</div>
						<div class="text-sm text-gray-500">완료</div>
					</div>
				</div>
			</div>

			<!-- 요청 목록 -->
			{#if my_requests.length > 0}
				<div class="space-y-4">
					{#each my_requests as request}
						<div
							class="cursor-pointer rounded-xl border border-gray-100 bg-white p-5 transition-all hover:shadow-md"
							onclick={() => goto(`/expert-request/${request.id}`)}
						>
							<!-- 상단: 제목과 상태 -->
							<div class="mb-3 flex items-center justify-between">
								<h3
									class="line-clamp-1 flex-1 pr-3 font-semibold text-gray-900"
								>
									{request.title}
								</h3>
								<span
									class={`rounded-full px-2.5 py-1 text-xs font-medium ${getRequestStatusDisplay(request.status).bgColor} ${getRequestStatusDisplay(request.status).textColor}`}
								>
									{getRequestStatusDisplay(request.status).text}
								</span>
							</div>

							<!-- 예산 및 메타 정보 -->
							<div class="mb-3 flex items-center justify-between">
								<span class="text-lg font-bold text-blue-600">
									{comma(request.reward_amount)}원
								</span>
								<div class="flex items-center gap-4 text-sm text-gray-500">
									<span>{formatDeadlineRelative(request.application_deadline)}</span>
									{#if request.category}
										<span>•</span>
										<span>{request.category}</span>
									{/if}
								</div>
							</div>

							<!-- 제안 수 및 등록일 -->
							<div class="flex items-center justify-between text-sm">
								<span class="font-medium text-blue-600">
									제안 {request.expert_request_proposals?.[0]?.count || 0}개
								</span>
								<span class="text-gray-400">
									{new Date(request.created_at).toLocaleDateString('ko-KR', {
										month: 'short',
										day: 'numeric',
									})}
								</span>
							</div>

							<!-- 진행중일 때 완료 버튼 -->
							{#if request.status === 'in_progress'}
								<div class="mt-3 border-t border-gray-100 pt-3">
									<button
										onclick={(e) => complete_project(request.id, e)}
										class="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
									>
										프로젝트 완료
									</button>
								</div>
							{/if}

							<!-- 완료됐을 때 리뷰 버튼 -->
							{#if request.status === 'completed' && review_data[request.id]}
								<div class="mt-3 border-t border-gray-100 pt-3">
									{#if review_data[request.id].my_review}
										<!-- 이미 리뷰를 작성한 경우 -->
										<div
											class="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3"
										>
											<div class="flex items-center gap-2">
												<span class="text-sm text-gray-600"
													>리뷰 작성 완료</span
												>
												<div class="flex items-center gap-1">
													{#each Array(5) as _, i}
														<svg
															class="h-4 w-4 {i <
															review_data[request.id].my_review.rating
																? 'text-yellow-400'
																: 'text-gray-300'}"
															fill="currentColor"
															viewBox="0 0 20 20"
														>
															<path
																d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
															/>
														</svg>
													{/each}
												</div>
											</div>
										</div>
									{:else if review_data[request.id].can_write}
										<!-- 리뷰 작성 가능한 경우 -->
										<button
											onclick={(e) => open_review_modal(request, e)}
											class="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
										>
											리뷰 작성하기
										</button>
									{/if}
								</div>
							{/if}
						</div>
					{/each}
				</div>
			{:else}
				<div class="rounded-xl border border-gray-100 bg-white p-8 text-center">
					<div
						class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100"
					>
						<RiFileTextLine size={24} color={colors.gray[400]} />
					</div>
					<h3 class="mb-2 text-lg font-semibold text-gray-900">
						아직 요청한 서비스가 없어요
					</h3>
					<p class="mb-4 text-sm text-gray-600">
						전문가에게 도움을 요청해보세요!
					</p>
					<button
						onclick={() => goto('/regi/expert-request')}
						class="rounded-xl bg-gray-900 px-6 py-3 font-medium text-white transition-colors hover:bg-gray-800"
					>
						전문가 요청하기
					</button>
				</div>
			{/if}
		</div>
	{/if}

	<!-- 탭 2: 제안한 서비스 -->
	{#if selected_tab === 1}
		<div class="mt-4 px-4">
			<!-- 통계 카드 -->
			<div class="mb-6 rounded-xl border border-gray-100 bg-white p-6">
				<h3 class="mb-4 text-lg font-semibold text-gray-900">내 제안 현황</h3>
				<div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
					<div class="text-center">
						<div class="text-2xl font-bold text-gray-900">
							{proposal_stats.total}
						</div>
						<div class="text-sm text-gray-500">전체</div>
					</div>
					<div class="text-center">
						<div class="text-2xl font-bold text-gray-600">
							{proposal_stats.pending}
						</div>
						<div class="text-sm text-gray-500">검토중</div>
					</div>
					<div class="text-center">
						<div class="text-2xl font-bold text-emerald-600">
							{proposal_stats.accepted}
						</div>
						<div class="text-sm text-gray-500">수락됨</div>
					</div>
					<div class="text-center">
						<div class="text-2xl font-bold text-red-600">
							{proposal_stats.rejected}
						</div>
						<div class="text-sm text-gray-500">거절됨</div>
					</div>
				</div>
			</div>

			<!-- 제안 목록 -->
			{#if my_proposals.length > 0}
				<div class="space-y-4">
					{#each my_proposals as proposal}
						<div
							class="cursor-pointer rounded-xl border border-gray-100 bg-white p-5 transition-all hover:shadow-md"
							onclick={() => goto(`/expert-request/${proposal.request_id}`)}
						>
							<!-- 상단: 프로젝트 제목과 상태 -->
							<div class="mb-3 flex items-center justify-between">
								<h3
									class="line-clamp-1 flex-1 pr-3 font-semibold text-gray-900"
								>
									{proposal.expert_requests?.title || '프로젝트'}
								</h3>
								<span
									class={`rounded-full px-2.5 py-1 text-xs font-medium ${getProposalStatusDisplay(proposal.status).bgColor} ${getProposalStatusDisplay(proposal.status).textColor}`}
								>
									{getProposalStatusDisplay(proposal.status).text}
								</span>
							</div>

							<!-- 제안 예산 및 기간 -->
							{#if proposal.proposed_budget || proposal.proposed_timeline}
								<div class="mb-3 flex items-center gap-6 text-sm">
									{#if proposal.proposed_budget}
										<span class="flex items-center gap-1">
											<span class="text-gray-400">제안 예산:</span>
											<span class="font-semibold text-blue-600"
												>{comma(proposal.proposed_budget)}원</span
											>
										</span>
									{/if}
									{#if proposal.proposed_timeline}
										<span class="flex items-center gap-1">
											<span class="text-gray-400">예상 기간:</span>
											<span class="font-medium text-gray-700"
												>{proposal.proposed_timeline}</span
											>
										</span>
									{/if}
								</div>
							{/if}

							<!-- 제안 메시지 미리보기 -->
							<p
								class="mb-3 line-clamp-2 text-sm leading-relaxed text-gray-600"
							>
								{proposal.message}
							</p>

							<!-- 하단: 요청자 정보 및 제안일 -->
							<div class="flex items-center justify-between text-sm">
								<div class="flex items-center gap-2">
									<span class="text-gray-400">요청자:</span>
									<span class="font-medium text-gray-700">
										{proposal.expert_requests?.users?.name ||
											proposal.expert_requests?.users?.handle ||
											'알 수 없음'}
									</span>
								</div>
								<span class="text-gray-400">
									{new Date(proposal.created_at).toLocaleDateString('ko-KR', {
										month: 'short',
										day: 'numeric',
									})}
								</span>
							</div>
						</div>
					{/each}
				</div>
			{:else}
				<div class="rounded-xl border border-gray-100 bg-white p-8 text-center">
					<div
						class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100"
					>
						<RiCheckLine size={24} color={colors.gray[400]} />
					</div>
					<h3 class="mb-2 text-lg font-semibold text-gray-900">
						아직 제안한 서비스가 없어요
					</h3>
					<p class="mb-4 text-sm text-gray-600">
						전문가로서 프로젝트에 제안해보세요!
					</p>
					<button
						onclick={() => goto('/service?tab=1')}
						class="rounded-xl bg-gray-900 px-6 py-3 font-medium text-white transition-colors hover:bg-gray-800"
					>
						전문가 요청 보러가기
					</button>
				</div>
			{/if}
		</div>
	{/if}
</main>

<!-- 리뷰 작성 모달 -->
{#if show_review_modal && current_review_request}
	<Modal
		is_modal_open={show_review_modal}
		modal_position="bottom"
		on:modal_close={close_review_modal}
	>
		<div class="p-6">
			<div class="mb-6 flex items-center justify-between">
				<h3 class="text-lg font-bold text-gray-900">리뷰 작성</h3>
				<button
					onclick={close_review_modal}
					class="text-gray-400 hover:text-gray-600"
				>
					<RiCloseLine size={24} />
				</button>
			</div>

			<div class="mb-4">
				<p class="text-sm text-gray-600">
					{current_review_request.title}
				</p>
			</div>

			<form
				onsubmit={(e) => {
					e.preventDefault();
					handle_review_submit();
				}}
			>
				<div class="space-y-4">
					<!-- 별점 선택 -->
					<div>
						<label class="mb-2 block text-sm font-medium text-gray-700">
							별점 <span class="text-red-500">*</span>
						</label>
						<div class="flex items-center gap-2">
							<StarRating
								bind:rating={review_form.rating}
								readonly={false}
								size={28}
							/>
						</div>
					</div>

					<!-- 리뷰 제목 -->
					<div>
						<label class="mb-2 block text-sm font-medium text-gray-700">
							리뷰 제목 <span class="text-red-500">*</span>
						</label>
						<input
							type="text"
							bind:value={review_form.title}
							placeholder="리뷰 제목을 입력해주세요"
							class="w-full rounded-lg border border-gray-200 p-3 text-sm focus:outline-none"
							required
							maxlength="100"
						/>
					</div>

					<!-- 리뷰 내용 -->
					<div>
						<label class="mb-2 block text-sm font-medium text-gray-700">
							리뷰 내용 <span class="text-red-500">*</span>
						</label>
						<textarea
							bind:value={review_form.content}
							placeholder="전문가의 서비스에 대한 솔직한 평가를 남겨주세요"
							class="w-full resize-none rounded-lg border border-gray-200 p-3 text-sm focus:outline-none"
							rows="6"
							required
							maxlength="1000"
						></textarea>
						<p class="mt-1 text-xs text-gray-500">
							{review_form.content.length} / 1000자
						</p>
					</div>
				</div>

				<div class="mt-6 flex gap-3">
					<button
						type="button"
						onclick={close_review_modal}
						class="flex-1 rounded-lg bg-gray-100 py-3 font-medium text-gray-600 transition-colors hover:bg-gray-200"
					>
						취소
					</button>
					<button
						type="submit"
						disabled={is_submitting_review}
						class="flex-1 rounded-lg bg-blue-600 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
					>
						{is_submitting_review ? '제출 중...' : '작성하기'}
					</button>
				</div>
			</form>
		</div>
	</Modal>
{/if}

<Bottom_nav />

<style>
	.line-clamp-1 {
		display: -webkit-box;
		-webkit-line-clamp: 1;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.line-clamp-2 {
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}
</style>
