<script>
	import {
		ERROR_MESSAGES,
		formatBudget,
		formatDeadlineAbsolute,
		getProposalStatusDisplay,
		getRequestStatusDisplay,
		SUCCESS_MESSAGES,
		validateProposalData,
	} from '$lib/utils/expert-request-utils';
	import { smartGoBack } from '$lib/utils/navigation';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import {
		RiArrowLeftSLine,
		RiCalendarLine,
		RiCloseLine,
		RiMoneyDollarCircleLine,
		RiTimeLine,
		RiUser3Line,
	} from 'svelte-remixicon';

	import Bottom_nav from '$lib/components/ui/Bottom_nav/+page.svelte';
	import Header from '$lib/components/ui/Header/+page.svelte';
	import Modal from '$lib/components/ui/Modal/+page.svelte';

	import colors from '$lib/js/colors';
	import { check_login, comma, show_toast } from '$lib/js/common';
	import { api_store } from '$lib/store/api_store';
	import { user_store } from '$lib/store/user_store';

	let { data } = $props();
	let { expert_request, proposals, user } = $state(data);

	// 제안서 작성 모달 상태
	let show_proposal_modal = $state(false);
	let proposal_form = $state({
		message: '',
		proposed_budget: '',
		proposed_timeline: '',
		contact_info: '',
	});

	// 구매하기 모달 상태
	let show_payment_modal = $state(false);
	let selected_proposal = $state(null);

	const submit_proposal = async () => {
		if (!check_login()) return;

		// 유효성 검사
		const validation_errors = validateProposalData(proposal_form);
		if (validation_errors.length > 0) {
			show_toast('error', validation_errors[0]);
			return;
		}

		try {
			await $api_store.expert_request_proposals.insert(
				{
					request_id: expert_request.id,
					message: proposal_form.message,
					proposed_budget: proposal_form.proposed_budget
						? parseInt(proposal_form.proposed_budget)
						: null,
					proposed_timeline: proposal_form.proposed_timeline || null,
					contact_info: proposal_form.contact_info || null,
				},
				user.id,
			);

			show_toast('success', SUCCESS_MESSAGES.PROPOSAL_SUBMITTED);
			show_proposal_modal = false;

			// 제안서 목록 새로고침
			proposals =
				await $api_store.expert_request_proposals.select_by_request_id(
					expert_request.id,
				);

			// 폼 초기화
			proposal_form = {
				message: '',
				proposed_budget: '',
				proposed_timeline: '',
				contact_info: '',
			};
		} catch (error) {
			console.error('Proposal submission error:', error);

			let errorMessage = ERROR_MESSAGES.SERVER_ERROR;

			if (error.message.includes('로그인')) {
				errorMessage = '로그인이 필요합니다.';
			} else if (error.message.includes('마감된')) {
				errorMessage = ERROR_MESSAGES.REQUEST_NOT_OPEN;
			} else if (error.message.includes('이미')) {
				errorMessage = ERROR_MESSAGES.ALREADY_PROPOSED;
			} else if (error.message.includes('자신의')) {
				errorMessage = '자신의 요청에는 제안할 수 없습니다.';
			} else if (error.message.includes('존재하지')) {
				errorMessage = ERROR_MESSAGES.NOT_FOUND;
			}

			show_toast('error', errorMessage);
		}
	};

	const can_submit_proposal = () => {
		return (
			user &&
			expert_request.status === 'open' &&
			expert_request.requester_id !== user.id &&
			!proposals.some((p) => p.expert_id === user.id)
		);
	};

	// 연락처 링크 생성
	const getContactLink = (contact_info) => {
		// 이메일인지 확인
		if (contact_info.includes('@') && contact_info.includes('.')) {
			return `mailto:${contact_info}`;
		}
		// 전화번호인지 확인 (숫자로만 구성되거나 하이픈 포함)
		if (/^[\d\-\(\)\s\+]+$/.test(contact_info)) {
			return `tel:${contact_info.replace(/[\s\(\)\-]/g, '')}`;
		}
		// 카카오톡 오픈채팅이나 링크인지 확인
		if (
			contact_info.includes('open.kakao.com') ||
			contact_info.includes('http')
		) {
			return contact_info.startsWith('http')
				? contact_info
				: `https://${contact_info}`;
		}
		// 기타의 경우 클립보드 복사를 위해 javascript: 프로토콜 사용
		return `javascript:void(0)`;
	};

	// 연락처 복사
	const copyContactInfo = async (contact_info) => {
		try {
			await navigator.clipboard.writeText(contact_info);
			show_toast('success', '연락처가 클립보드에 복사되었습니다.');
		} catch (error) {
			// fallback for older browsers
			const textArea = document.createElement('textarea');
			textArea.value = contact_info;
			document.body.appendChild(textArea);
			textArea.select();
			document.execCommand('copy');
			document.body.removeChild(textArea);
			show_toast('success', '연락처가 클립보드에 복사되었습니다.');
		}
	};

	const is_requester = () => {
		return user && expert_request.requester_id === user.id;
	};

	const accept_proposal = async (proposal_id) => {
		// 제안을 선택하고 결제 모달 표시
		selected_proposal = proposals.find((p) => p.id === proposal_id);
		show_payment_modal = true;
	};

	// 실제 제안 수락 및 결제 처리
	const process_payment_and_accept = async () => {
		if (!selected_proposal) return;

		try {
			await $api_store.expert_request_proposals.accept_proposal(
				selected_proposal.id,
				expert_request.id,
			);
			show_toast(
				'success',
				'결제가 완료되었습니다! 전문가가 연락을 드릴 예정입니다.',
			);
			show_payment_modal = false;
			selected_proposal = null;

			// 데이터 새로고침
			proposals =
				await $api_store.expert_request_proposals.select_by_request_id(
					expert_request.id,
				);
			expert_request = await $api_store.expert_requests.select_by_id(
				expert_request.id,
			);
		} catch (error) {
			console.error('Proposal acceptance error:', error);

			let errorMessage = ERROR_MESSAGES.SERVER_ERROR;

			if (error.message.includes('Only the requester')) {
				errorMessage = ERROR_MESSAGES.UNAUTHORIZED;
			} else if (error.message.includes('not open')) {
				errorMessage = ERROR_MESSAGES.REQUEST_NOT_OPEN;
			} else if (error.message.includes('does not exist')) {
				errorMessage = ERROR_MESSAGES.NOT_FOUND;
			}

			show_toast('error', errorMessage);
		}
	};

	// 결제 폼 데이터
	let order_form_data = $state({
		depositor_name: '',
		bank: '',
		account_number: '',
		buyer_contact: '',
		special_request: '',
	});

	const is_order_form_valid = $derived(
		order_form_data.depositor_name.trim() &&
			order_form_data.bank.trim() &&
			order_form_data.account_number.trim() &&
			order_form_data.buyer_contact.trim(),
	);

	const reject_proposal = async (proposal_id) => {
		if (!confirm('이 제안을 거절하시겠습니까?')) {
			return;
		}

		try {
			await $api_store.expert_request_proposals.reject_proposal(proposal_id);
			show_toast('success', SUCCESS_MESSAGES.PROPOSAL_REJECTED);

			// 제안 목록 새로고침
			proposals =
				await $api_store.expert_request_proposals.select_by_request_id(
					expert_request.id,
				);
		} catch (error) {
			console.error('Proposal rejection error:', error);
			show_toast('error', ERROR_MESSAGES.SERVER_ERROR);
		}
	};

	const complete_project = async () => {
		if (!confirm('프로젝트를 완료하시겠습니까?')) {
			return;
		}

		try {
			await $api_store.expert_requests.complete_project(expert_request.id);
			show_toast('success', SUCCESS_MESSAGES.PROJECT_COMPLETED);

			// 데이터 새로고침
			expert_request = await $api_store.expert_requests.select_by_id(
				expert_request.id,
			);
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
</script>

<svelte:head>
	<title>{expert_request.title} | 문</title>
	<meta name="description" content={expert_request.description} />
</svelte:head>

<Header>
	<button slot="left" onclick={smartGoBack}>
		<RiArrowLeftSLine size={28} color={colors.gray[600]} />
	</button>
	<h1 slot="center" class="font-semibold">전문가 요청</h1>
</Header>

<main class="min-h-screen bg-gray-50 pb-20">
	<!-- 요청 정보 -->
	<div class="px-4 pt-4 pb-6">
		<div
			class="rounded-xl border border-gray-100/60 bg-white p-5 transition-all hover:shadow-md"
		>
			<!-- 제목과 상태 -->
			<div class="mb-3 flex items-center justify-between">
				<h1 class="line-clamp-2 flex-1 pr-3 text-lg font-bold text-gray-900">
					{expert_request.title}
				</h1>
				<span
					class={`rounded-full px-2.5 py-1 text-xs font-medium ${getRequestStatusDisplay(expert_request.status).bgColor} ${getRequestStatusDisplay(expert_request.status).textColor}`}
				>
					{getRequestStatusDisplay(expert_request.status).text}
				</span>
			</div>

			<!-- 예산 -->
			<div class="mb-3">
				<span class="text-lg font-bold text-blue-600">
					{formatBudget(expert_request.budget_min, expert_request.budget_max)}
				</span>
			</div>

			<!-- 메타 정보 -->
			<div class="mb-4 flex items-center gap-4 text-sm text-gray-500">
				<span>{formatDeadlineAbsolute(expert_request.deadline)}</span>
				{#if expert_request.category}
					<span>•</span>
					<span>{expert_request.category}</span>
				{/if}
			</div>

			<!-- 요청자 정보 -->
			<div class="flex items-center justify-between text-sm">
				<div class="flex items-center gap-2">
					{#if expert_request.users?.avatar_url}
						<img
							src={expert_request.users.avatar_url}
							alt=""
							class="aspect-square h-6 w-6 rounded-full"
						/>
					{:else}
						<div
							class="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200"
						>
							<span class="text-xs text-gray-500">
								{(expert_request.users?.name ||
									expert_request.users?.handle)?.[0]?.toUpperCase()}
							</span>
						</div>
					{/if}
					<span class="font-medium text-gray-700">
						{expert_request.users?.name || expert_request.users?.handle}
					</span>
				</div>
				<span class="text-gray-400">
					{new Date(expert_request.created_at).toLocaleDateString('ko-KR', {
						month: 'short',
						day: 'numeric',
					})}
				</span>
			</div>
		</div>
	</div>

	<!-- 상세 설명 -->
	<div class="px-4 pb-6">
		<div class="rounded-xl border border-gray-100/60 bg-white p-5">
			<h3 class="mb-3 font-semibold text-gray-900">상세 설명</h3>
			<p class="text-sm leading-relaxed whitespace-pre-wrap text-gray-600">
				{expert_request.description}
			</p>
		</div>
	</div>

	<!-- 수락된 제안 알림 -->
	{#if proposals.some((p) => p.status === 'accepted')}
		<div class="mb-4 px-4">
			<div class="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
				<div class="flex items-center gap-3">
					<div
						class="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100"
					>
						<svg
							class="h-4 w-4 text-emerald-600"
							fill="currentColor"
							viewBox="0 0 20 20"
						>
							<path
								fill-rule="evenodd"
								d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
								clip-rule="evenodd"
							/>
						</svg>
					</div>
					<div class="flex-1">
						<p class="text-sm font-semibold text-emerald-800">
							제안이 수락되었습니다!
						</p>
						<p class="text-xs text-emerald-700">
							선택된 전문가와 프로젝트를 진행해보세요.
						</p>
					</div>

					{#if is_requester() && expert_request.status === 'in_progress'}
						<button
							onclick={() => complete_project()}
							class="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-emerald-700"
						>
							완료
						</button>
					{/if}
				</div>
			</div>
		</div>
	{/if}

	<!-- 제안서 섹션 -->
	<div class="px-4">
		<div class="rounded-xl border border-gray-100/60 bg-white p-5">
			<div class="mb-4 flex items-center justify-between">
				<h2 class="font-semibold text-gray-900">
					받은 제안 ({proposals.length}개)
				</h2>

				{#if can_submit_proposal()}
					<button
						class="rounded-lg bg-gray-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-gray-800"
						onclick={() => (show_proposal_modal = true)}
					>
						제안하기
					</button>
				{/if}
			</div>

			{#if proposals.length > 0}
				<div class="space-y-3">
					{#each proposals as proposal}
						<div
							class="rounded-xl border border-gray-100 p-4 transition-colors hover:bg-gray-50/50"
						>
							<div class="mb-3 flex items-start gap-3">
								<div
									class="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gray-200"
								>
									{#if proposal.users?.avatar_url}
										<img
											src={proposal.users.avatar_url}
											alt=""
											class="h-full w-full object-cover"
										/>
									{:else}
										<span class="text-xs text-gray-500">
											{(proposal.users?.name ||
												proposal.users?.handle)?.[0]?.toUpperCase()}
										</span>
									{/if}
								</div>
								<div class="flex-1">
									<p class="text-sm font-medium text-gray-900">
										{proposal.users?.name || proposal.users?.handle}
									</p>
									<p class="text-xs text-gray-500">
										{new Date(proposal.created_at).toLocaleDateString('ko-KR', {
											month: 'short',
											day: 'numeric',
										})}
									</p>
								</div>
								<div class="flex items-center gap-2">
									<!-- 의뢰인에게는 항상 문의하기 버튼 표시 (연락처가 있는 경우) -->
									{#if is_requester() && proposal.contact_info}
										<button
											onclick={() => {
												copyContactInfo(proposal.contact_info);
											}}
											class="rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-600 transition-colors hover:bg-blue-100"
										>
											문의하기
										</button>
									{/if}

									{#if proposal.status === 'accepted'}
										<span
											class="rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-600"
										>
											✓ 수락됨
										</span>
									{:else if proposal.status === 'rejected'}
										<span
											class="rounded-full bg-gray-50 px-2 py-1 text-xs font-medium text-gray-500"
										>
											거절됨
										</span>
									{/if}

									<!-- 수락 버튼은 pending 상태일 때만 표시 -->
									{#if is_requester() && proposal.status === 'pending' && expert_request.status === 'open'}
										<button
											onclick={() => accept_proposal(proposal.id)}
											class="rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-600 transition-colors hover:bg-emerald-100"
										>
											수락
										</button>
									{/if}
								</div>
							</div>

							<p class="mb-3 text-sm leading-relaxed text-gray-600">
								{proposal.message}
							</p>

							{#if proposal.proposed_budget || proposal.proposed_timeline || (proposal.contact_info && (is_requester() || proposal.status === 'accepted'))}
								<div class="flex items-center gap-4 text-xs text-gray-500">
									{#if proposal.proposed_budget}
										<span class="flex items-center gap-1">
											<span>💰</span>
											<span class="font-medium text-blue-600"
												>{comma(proposal.proposed_budget)}원</span
											>
										</span>
									{/if}
									{#if proposal.proposed_timeline}
										<span class="flex items-center gap-1">
											<span>📅</span>
											<span>{proposal.proposed_timeline}</span>
										</span>
									{/if}
									{#if proposal.contact_info && (is_requester() || proposal.status === 'accepted')}
										<span class="flex items-center gap-1">
											<span>📞</span>
											<span class="font-medium">{proposal.contact_info}</span>
										</span>
									{/if}
								</div>
							{/if}
						</div>
					{/each}
				</div>
			{:else}
				<div class="py-8 text-center">
					<div
						class="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100"
					>
						<RiTimeLine size={20} color={colors.gray[400]} />
					</div>
					<h3 class="mb-2 font-medium text-gray-900">아직 제안이 없어요</h3>
					<p class="text-sm text-gray-500">첫 번째로 제안해보세요!</p>
				</div>
			{/if}
		</div>
	</div>
</main>

<!-- 제안서 작성 모달 -->
{#if show_proposal_modal}
	<Modal
		is_modal_open={show_proposal_modal}
		modal_position="bottom"
		on:modal_close={() => (show_proposal_modal = false)}
	>
		<div class="p-6">
			<div class="mb-6 flex items-center justify-between">
				<h3 class="text-lg font-bold text-gray-900">제안서 작성</h3>
				<button
					onclick={() => (show_proposal_modal = false)}
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
						></path>
					</svg>
				</button>
			</div>

			<form
				onsubmit={(e) => {
					e.preventDefault();
					submit_proposal();
				}}
			>
				<div class="space-y-4">
					<div>
						<label class="mb-2 block text-sm font-medium text-gray-700">
							제안 메시지 <span class="text-red-500">*</span>
						</label>
						<textarea
							bind:value={proposal_form.message}
							placeholder="프로젝트에 대한 이해도와 작업 계획을 설명해주세요."
							class="w-full resize-none rounded-lg border border-gray-200 p-3 text-sm focus:outline-none"
							rows="6"
							required
						></textarea>
					</div>

					<div>
						<label class="mb-2 block text-sm font-medium text-gray-700">
							제안 예산 (원)
						</label>
						<input
							type="number"
							bind:value={proposal_form.proposed_budget}
							placeholder="예: 1000000"
							class="w-full resize-none rounded-lg border border-gray-200 p-3 text-sm focus:outline-none"
							min="0"
						/>
					</div>

					<div>
						<label class="mb-2 block text-sm font-medium text-gray-700">
							예상 작업 기간
						</label>
						<input
							type="text"
							bind:value={proposal_form.proposed_timeline}
							placeholder="예: 2주, 1개월"
							class="w-full resize-none rounded-lg border border-gray-200 p-3 text-sm focus:outline-none"
						/>
					</div>

					<div>
						<label class="mb-2 block text-sm font-medium text-gray-700">
							연락처 <span class="text-red-500">*</span>
						</label>
						<input
							type="text"
							bind:value={proposal_form.contact_info}
							placeholder="카카오톡 ID, 이메일, 전화번호 등"
							class="w-full resize-none rounded-lg border border-gray-200 p-3 text-sm focus:outline-none"
							required
						/>
						<p class="mt-1 text-xs text-gray-500">
							제안이 수락되면 의뢰인이 이 연락처로 연락을 드릴 예정입니다.
						</p>
					</div>
				</div>

				<div class="mt-6 flex gap-3">
					<button
						type="button"
						onclick={() => (show_proposal_modal = false)}
						class="flex-1 rounded-lg bg-gray-100 py-3 font-medium text-gray-600 transition-colors hover:bg-gray-200"
					>
						취소
					</button>
					<button
						type="submit"
						class="flex-1 rounded-lg bg-gray-900 py-3 font-medium text-white transition-colors hover:bg-gray-800"
					>
						제안하기
					</button>
				</div>
			</form>
		</div>
	</Modal>
{/if}

<!-- 구매하기 모달 -->
{#if show_payment_modal && selected_proposal}
	<Modal
		is_modal_open={show_payment_modal}
		modal_position="bottom"
		on:modal_close={() => {
			show_payment_modal = false;
			selected_proposal = null;
		}}
	>
		<div class="p-4">
			<div class="flex justify-between">
				<h3 class="font-semibold">전문가 서비스 구매하기</h3>
				<button
					onclick={() => {
						show_payment_modal = false;
						selected_proposal = null;
					}}
				>
					<RiCloseLine size={24} color={colors.gray[400]} />
				</button>
			</div>

			<div class="mt-4 rounded-lg bg-gray-50 p-4">
				<div class="mb-2 flex items-center gap-3">
					{#if selected_proposal.users?.avatar_url}
						<img
							src={selected_proposal.users.avatar_url}
							alt=""
							class="h-8 w-8 rounded-full object-cover"
						/>
					{:else}
						<div
							class="flex h-8 w-8 items-center justify-center rounded-full bg-gray-200"
						>
							<span class="text-xs text-gray-500">
								{(selected_proposal.users?.name ||
									selected_proposal.users?.handle)?.[0]?.toUpperCase()}
							</span>
						</div>
					{/if}
					<div>
						<p class="text-sm font-medium">
							{selected_proposal.users?.name || selected_proposal.users?.handle}
						</p>
						<p class="text-xs text-gray-500">전문가</p>
					</div>
				</div>
				<p class="mb-2 text-sm text-gray-600">
					{selected_proposal.message.substring(0, 100)}{selected_proposal
						.message.length > 100
						? '...'
						: ''}
				</p>
				{#if selected_proposal.contact_info}
					<p class="text-xs text-green-600">
						📞 {selected_proposal.contact_info}
					</p>
				{/if}
			</div>

			<div class="mt-6 space-y-4">
				<div>
					<p class="text-sm font-medium">입금자명</p>
					<input
						bind:value={order_form_data.depositor_name}
						type="text"
						placeholder="입금자명을 입력해주세요"
						class="mt-1 w-full rounded-lg border border-gray-200 p-2 text-sm focus:outline-none"
					/>
				</div>

				<div>
					<p class="text-sm font-medium">은행</p>
					<input
						bind:value={order_form_data.bank}
						type="text"
						placeholder="은행명을 입력해주세요"
						class="mt-1 w-full rounded-lg border border-gray-200 p-2 text-sm focus:outline-none"
					/>
				</div>

				<div>
					<p class="text-sm font-medium">계좌번호</p>
					<input
						bind:value={order_form_data.account_number}
						type="text"
						placeholder="계좌번호를 입력해주세요"
						class="mt-1 w-full rounded-lg border border-gray-200 p-2 text-sm focus:outline-none"
					/>
				</div>

				<div>
					<p class="text-sm font-medium">연락처</p>
					<input
						bind:value={order_form_data.buyer_contact}
						type="text"
						placeholder="전화번호 또는 카카오톡 ID 등 연락받을 연락처를 입력해주세요"
						class="mt-1 w-full rounded-lg border border-gray-200 p-2 text-sm focus:outline-none"
					/>
				</div>

				<div>
					<p class="text-sm font-medium">특별 요청사항 (선택)</p>
					<textarea
						bind:value={order_form_data.special_request}
						placeholder="추가로 요청하실 내용이 있으면 입력해주세요"
						class="mt-1 w-full resize-none rounded-lg border border-gray-200 p-2 text-sm focus:outline-none"
						rows="3"
					></textarea>
				</div>
			</div>

			<div class="my-4 h-px bg-gray-200"></div>

			<div class="space-y-2">
				<div class="flex justify-between">
					<p class="text-sm text-gray-600">전문가 서비스 금액</p>
					<p class="text-sm">
						₩{selected_proposal.proposed_budget
							? comma(selected_proposal.proposed_budget)
							: '협의'}
					</p>
				</div>
				{#if selected_proposal.proposed_budget}
					<div class="flex justify-between">
						<p class="text-sm text-gray-600">플랫폼 수수료 (5%)</p>
						<p class="text-sm text-gray-500">
							+₩{comma(Math.floor(selected_proposal.proposed_budget * 0.05))}
						</p>
					</div>
					<div class="flex justify-between border-t pt-2">
						<p class="font-semibold">총 결제 금액</p>
						<p class="text-primary text-lg font-bold">
							₩{comma(
								selected_proposal.proposed_budget +
									Math.floor(selected_proposal.proposed_budget * 0.05),
							)}
						</p>
					</div>
				{:else}
					<div class="flex justify-between border-t pt-2">
						<p class="font-semibold">총 결제 금액</p>
						<p class="text-primary text-lg font-bold">협의 후 결정</p>
					</div>
				{/if}
			</div>

			<!-- 입금 계좌 안내 박스 -->
			<div
				class="mt-4 mb-6 rounded-md border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-900"
			>
				<span class="font-bold">💡 입금 계좌 안내</span><br />
				은행: <span class="font-semibold">국민은행</span><br />
				예금주: <span class="font-semibold">이상민</span><br />
				계좌번호: <span class="font-semibold">939302-00-616198</span>
			</div>

			<div
				class="mt-2 flex flex-col justify-center bg-gray-50 px-4 py-2 text-sm text-gray-900"
			>
				<p>
					아직은 계좌이체만 지원되고 있어요!<br />
					더 편리한 결제를 위해 다양한 수단을 준비 중이니 조금만 기다려주세요 😊
				</p>
			</div>

			<button
				onclick={process_payment_and_accept}
				disabled={!is_order_form_valid}
				class="mt-4 w-full rounded-xl bg-gray-900 py-4 font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
			>
				주문하기
			</button>
		</div>
	</Modal>
{/if}

<Bottom_nav />
