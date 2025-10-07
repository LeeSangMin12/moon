<script>
	import { servicemark } from '@tiptap/extension-typography';
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
	import StarRating from '$lib/components/ui/StarRating/+page.svelte';

	import colors from '$lib/js/colors';
	import { check_login, comma, show_toast } from '$lib/js/common';
	import { api_store } from '$lib/store/api_store';
	import { user_store } from '$lib/store/user_store';

	let { data } = $props();
	let {
		expert_request,
		proposals,
		user,
		can_write_review,
		review_proposal_id,
		review_expert_id,
		my_review,
	} = $state(data);

	// 첨부파일 맵 (proposal_id -> attachments[])
	let proposal_attachments_map = $state({});

	// 제안서 작성 모달 상태
	let show_proposal_modal = $state(false);
	let proposal_form = $state({
		message: '',
		contact_info: '',
		is_secret: false,
	});
	let attached_files = $state([]);
	let file_input;

	// 구매하기 모달 상태
	let show_payment_modal = $state(false);
	let selected_proposal = $state(null);

	// 리뷰 모달 상태
	let show_review_modal = $state(false);
	let is_submitting_review = $state(false);
	let review_form = $state({
		rating: 0,
		title: '',
		content: '',
	});

	// 파일 선택 처리
	const handle_file_select = (e) => {
		const files = Array.from(e.target.files || []);
		const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
		const MAX_FILES = 5;

		if (attached_files.length + files.length > MAX_FILES) {
			show_toast('error', `최대 ${MAX_FILES}개의 파일만 첨부할 수 있습니다.`);
			return;
		}

		const valid_files = files.filter((file) => {
			if (file.size > MAX_FILE_SIZE) {
				show_toast('error', `${file.name}은(는) 10MB를 초과합니다.`);
				return false;
			}
			return true;
		});

		attached_files = [...attached_files, ...valid_files];
	};

	// 파일 제거
	const remove_file = (index) => {
		attached_files = attached_files.filter((_, i) => i !== index);
	};

	// 파일 크기 포맷
	const format_file_size = (bytes) => {
		if (bytes === 0) return '0 Bytes';
		const k = 1024;
		const sizes = ['Bytes', 'KB', 'MB'];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
	};

	// 파일명 안전하게 변환 (UUID로 대체, 원본명은 DB에 저장)
	const sanitize_filename = (filename, index) => {
		const ext = filename.substring(filename.lastIndexOf('.'));
		const uuid =
			Math.random().toString(36).substring(2, 15) +
			Math.random().toString(36).substring(2, 15);
		return `${index}_${uuid}${ext}`;
	};

	const submit_proposal = async () => {
		if (!check_login()) return;

		// 유효성 검사
		const validation_errors = validateProposalData(proposal_form);
		if (validation_errors.length > 0) {
			show_toast('error', validation_errors[0]);
			return;
		}

		try {
			// 1. 제안서 생성
			const new_proposal = await $api_store.expert_request_proposals.insert(
				{
					request_id: expert_request.id,
					message: proposal_form.message,
					contact_info: proposal_form.contact_info || null,
					is_secret: proposal_form.is_secret,
				},
				user.id,
			);

			// 2. 파일이 있으면 업로드
			if (attached_files.length > 0) {
				const timestamp = Date.now();
				const files_with_paths = attached_files.map((file, index) => ({
					path: `${user.id}/${new_proposal.id}/${timestamp}_${sanitize_filename(file.name, index)}`,
					file: file,
				}));

				// Storage에 업로드
				const upload_result =
					await $api_store.proposal_attachments_bucket.upload_multiple(
						files_with_paths,
					);

				// DB에 첨부파일 정보 저장
				if (upload_result.successful_uploads.length > 0) {
					const attachments_data = upload_result.successful_uploads.map(
						(upload) => {
							const file = attached_files[upload.index];
							return {
								proposal_id: new_proposal.id,
								file_url: upload.path,
								file_name: file.name,
								file_size: file.size,
								file_type: file.type,
							};
						},
					);

					await $api_store.proposal_attachments.insert_multiple(
						attachments_data,
						user.id,
					);
				}
			}

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
				contact_info: '',
				is_secret: false,
			};
			attached_files = [];
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

	// 리뷰 관련 함수들
	const reset_review_form = () => {
		review_form = {
			rating: 0,
			title: '',
			content: '',
		};
	};

	const validate_review_form = () => {
		if (review_form.rating === 0) {
			show_toast('error', '별점을 선택해주세요.');
			return false;
		}
		if (!review_form.title.trim()) {
			show_toast('error', '리뷰 제목을 입력해주세요.');
			return false;
		}
		if (!review_form.content.trim()) {
			show_toast('error', '리뷰 내용을 입력해주세요.');
			return false;
		}
		return true;
	};

	const handle_review_submit = async () => {
		if (!check_login() || is_submitting_review || !validate_review_form())
			return;

		try {
			is_submitting_review = true;

			if (!my_review && can_write_review) {
				// 새 리뷰 작성
				const review_data = {
					request_id: expert_request.id,
					proposal_id: review_proposal_id,
					reviewer_id: user.id,
					expert_id: review_expert_id,
					rating: review_form.rating,
					title: review_form.title.trim(),
					content: review_form.content.trim(),
				};
				await $api_store.expert_request_reviews.insert(review_data);

				// 알림 생성: 전문가에게 리뷰 작성 알림
				try {
					if (review_expert_id && review_expert_id !== user.id) {
						await $api_store.notifications.insert({
							recipient_id: review_expert_id,
							actor_id: user.id,
							type: 'expert_review.created',
							resource_type: 'expert_request',
							resource_id: String(expert_request.id),
							payload: {
								request_id: expert_request.id,
								request_title: expert_request.title,
								rating: review_form.rating,
								title: review_form.title,
							},
							link_url: `/expert-request/${expert_request.id}`,
						});
					}
				} catch (e) {
					console.error(
						'Failed to insert notification (expert_review.created):',
						e,
					);
				}

				show_toast('success', '리뷰가 작성되었습니다.');
			} else if (my_review) {
				// 기존 리뷰 수정
				await $api_store.expert_request_reviews.update(my_review.id, {
					rating: review_form.rating,
					title: review_form.title.trim(),
					content: review_form.content.trim(),
				});
				show_toast('success', '리뷰가 수정되었습니다.');
			}

			// 데이터 새로고침
			my_review =
				await $api_store.expert_request_reviews.select_by_request_and_reviewer(
					expert_request.id,
					user.id,
				);

			show_review_modal = false;
			reset_review_form();
		} catch (error) {
			console.error('리뷰 작성/수정 실패:', error);
			show_toast('error', '리뷰 작성에 실패했습니다. 다시 시도해주세요.');
		} finally {
			is_submitting_review = false;
		}
	};

	const open_review_modal = () => {
		if (my_review) {
			// 기존 리뷰 수정 모드
			review_form = {
				rating: my_review.rating,
				title: my_review.title || '',
				content: my_review.content || '',
			};
		} else {
			// 새 리뷰 작성 모드
			reset_review_form();
		}
		show_review_modal = true;
	};

	// 각 제안의 첨부파일 로드
	const load_attachments = async () => {
		try {
			const attachments_promises = proposals.map(async (proposal) => {
				const attachments =
					await $api_store.proposal_attachments.select_by_proposal_id(
						proposal.id,
					);
				return { proposal_id: proposal.id, attachments };
			});

			const results = await Promise.all(attachments_promises);
			const new_map = {};
			results.forEach((result) => {
				new_map[result.proposal_id] = result.attachments;
			});
			proposal_attachments_map = new_map;
		} catch (error) {
			console.error('Failed to load attachments:', error);
		}
	};

	// 페이지 로드 시 첨부파일 로드
	onMount(() => {
		load_attachments();
	});
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
			class="rounded-xl border border-gray-100/60 bg-white p-5 transition-all"
		>
			<!-- 카테고리 칩과 상태 -->
			<div class="mb-3 flex items-start justify-between">
				<div class="flex-1">
					{#if expert_request.category}
						<div class="mb-2">
							<span
								class="inline-flex items-center rounded-md bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600"
							>
								{expert_request.category}
							</span>
						</div>
					{/if}
					<h1
						class="mt-4 line-clamp-2 text-xl leading-tight font-semibold text-gray-900"
					>
						{expert_request.title}
					</h1>
				</div>
				<span
					class={`ml-3 flex-shrink-0 rounded-md px-2.5 py-1 text-xs font-medium ${getRequestStatusDisplay(expert_request.status).bgColor} ${getRequestStatusDisplay(expert_request.status).textColor}`}
				>
					{getRequestStatusDisplay(expert_request.status).text}
				</span>
			</div>

			<!-- 보상금 -->
			<div class="mb-8">
				<span class="text-lg font-medium text-blue-600">
					{comma(expert_request.reward_amount)}원
				</span>
			</div>

			<!-- 메타 정보 -->
			<div class="mb-4 space-y-3">
				{#if expert_request.application_deadline}
					<div class="flex items-center text-sm">
						<span class="w-20 text-gray-500">마감일</span>
						<span class="font-medium text-gray-900">
							{new Date(expert_request.application_deadline).toLocaleDateString(
								'ko-KR',
							)}
						</span>
					</div>
				{/if}

				<div class="flex items-center text-sm">
					<span class="w-20 text-gray-500">모집인원</span>
					<span class="font-medium text-gray-900">
						{expert_request.max_applicants}명
					</span>
				</div>

				<div class="flex items-center text-sm">
					<span class="w-20 text-gray-500">근무지</span>
					<span class="font-medium text-gray-900">
						{expert_request.work_location}
					</span>
				</div>

				{#if expert_request.work_start_date && expert_request.work_end_date}
					<div class="flex items-center text-sm">
						<span class="w-20 text-gray-500">예상 기간</span>
						<span class="font-medium text-gray-900">
							{new Date(expert_request.work_start_date).toLocaleDateString(
								'ko-KR',
							)} ~ {new Date(expert_request.work_end_date).toLocaleDateString(
								'ko-KR',
							)}
						</span>
					</div>
				{/if}
			</div>

			<!-- 요청자 정보 -->
			<div class="mt-8 flex items-center justify-between text-sm">
				<button
					class="-m-1 flex items-center gap-2 rounded-lg p-1 transition-colors hover:bg-gray-50"
					onclick={() =>
						expert_request.users?.handle &&
						goto(`/@${expert_request.users.handle}`)}
				>
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
				</button>
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
			<h3 class="mb-3 font-semibold text-gray-900">프로젝트 설명</h3>
			<div
				class="prose prose-sm max-w-none text-sm leading-relaxed text-gray-600"
			>
				{@html expert_request.description}
			</div>
		</div>
	</div>

	<!-- 수락된 제안 알림 (요청자에게만 표시) -->
	{#if user && is_requester() && proposals.some((p) => p.status === 'accepted')}
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

					{#if expert_request.status === 'in_progress'}
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

	<!-- 리뷰 섹션 (의뢰인용, 프로젝트 완료 후) -->
	{#if is_requester() && expert_request.status === 'completed'}
		<div class="mb-4 px-4">
			<div class="rounded-xl border border-gray-200 bg-white p-4">
				<div class="mb-3 flex items-center justify-between">
					<h3 class="font-semibold text-gray-900">전문가 리뷰</h3>
					{#if !my_review && can_write_review}
						<button
							onclick={open_review_modal}
							class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700"
						>
							리뷰 작성
						</button>
					{/if}
				</div>

				{#if my_review}
					<div class="rounded-lg border border-gray-100 bg-gray-50 p-4">
						<div class="mb-2 flex items-center gap-2">
							<StarRating rating={my_review.rating} readonly={true} />
							<span class="text-sm font-medium text-gray-600">
								{my_review.rating}.0
							</span>
						</div>
						<h4 class="mb-2 font-semibold text-gray-900">{my_review.title}</h4>
						<p class="mb-3 text-sm text-gray-600">{my_review.content}</p>
						<div
							class="flex items-center justify-between text-xs text-gray-400"
						>
							<span>
								{new Date(my_review.created_at).toLocaleDateString('ko-KR')}
							</span>
							<button
								onclick={open_review_modal}
								class="text-blue-600 hover:text-blue-700"
							>
								수정
							</button>
						</div>
					</div>
				{:else if !can_write_review}
					<p class="text-sm text-gray-600">
						리뷰를 작성하려면 프로젝트가 완료되어야 합니다.
					</p>
				{:else}
					<p class="text-sm text-gray-600">
						프로젝트가 완료되었습니다. 전문가에게 리뷰를 남겨주세요!
					</p>
				{/if}
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
								<button
									class="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gray-200 transition-opacity hover:opacity-80"
									onclick={() =>
										proposal.users?.handle &&
										goto(`/@${proposal.users.handle}`)}
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
								</button>
								<div class="flex-1">
									<div class="flex items-center gap-2">
										<button
											class="text-sm font-medium text-gray-900 transition-colors hover:text-blue-600"
											onclick={() =>
												proposal.users?.handle &&
												goto(`/@${proposal.users.handle}`)}
										>
											{proposal.users?.name || proposal.users?.handle}
										</button>
										{#if proposal.is_secret}
											<span
												class="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600"
											>
												<svg
													class="mr-1 h-3 w-3"
													fill="currentColor"
													viewBox="0 0 20 20"
												>
													<path
														fill-rule="evenodd"
														d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
														clip-rule="evenodd"
													/>
												</svg>
												비밀
											</span>
										{/if}
									</div>
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

							<!-- 제안 내용 표시 (비밀제안 처리) -->
							{#if proposal.is_secret && !is_requester() && proposal.status !== 'accepted'}
								<div
									class="mb-3 rounded-lg border border-gray-200 bg-gray-50 p-3"
								>
									<div class="flex items-center gap-2">
										<svg
											class="h-4 w-4 text-gray-500"
											fill="currentColor"
											viewBox="0 0 20 20"
										>
											<path
												fill-rule="evenodd"
												d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
												clip-rule="evenodd"
											/>
										</svg>
										<span class="text-sm font-medium text-gray-600"
											>비밀제안</span
										>
									</div>
									<p class="mt-2 text-xs text-gray-500">
										이 제안은 의뢰인만 내용을 확인할 수 있습니다.
									</p>
								</div>
							{:else}
								<p
									class="overflow-wrap-anywhere mb-3 text-sm leading-relaxed break-words whitespace-pre-line text-gray-600"
								>
									{proposal.message}
								</p>
							{/if}

							<!-- 첨부파일 표시 -->
							{#if (!proposal.is_secret || is_requester() || proposal.status === 'accepted') && proposal_attachments_map[proposal.id]?.length > 0}
								<div class="mb-3">
									<p class="mb-2 text-xs font-medium text-gray-600">첨부파일</p>
									<div class="space-y-2">
										{#each proposal_attachments_map[proposal.id] as attachment}
											<a
												href={$api_store.proposal_attachments_bucket.get_public_url(
													attachment.file_url,
												)}
												download={attachment.file_name}
												target="_blank"
												class="flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 p-2 transition-colors hover:bg-gray-100"
											>
												<span class="text-base">📄</span>
												<div class="min-w-0 flex-1">
													<p class="truncate text-xs font-medium text-gray-700">
														{attachment.file_name}
													</p>
													<p class="text-xs text-gray-500">
														{format_file_size(attachment.file_size)}
													</p>
												</div>
												<svg
													class="h-4 w-4 text-gray-400"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path
														stroke-linecap="round"
														stroke-linejoin="round"
														stroke-width="2"
														d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
													/>
												</svg>
											</a>
										{/each}
									</div>
								</div>
							{/if}

							<!-- 제안 세부 정보 (비밀제안일 때 조건부 표시) -->
							{#if (!proposal.is_secret || is_requester() || proposal.status === 'accepted') && proposal.contact_info && (is_requester() || proposal.status === 'accepted')}
								<div class="flex items-center gap-4 text-xs text-gray-500">
									<span class="flex items-center gap-1">
										<span>📞</span>
										<span class="font-medium">{proposal.contact_info}</span>
									</span>
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

					<!-- 파일 첨부 -->
					<div>
						<label class="mb-2 block text-sm font-medium text-gray-700">
							이력서/포트폴리오 첨부
						</label>
						<input
							type="file"
							bind:this={file_input}
							onchange={handle_file_select}
							multiple
							accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
							class="hidden"
						/>
						<button
							type="button"
							onclick={() => file_input?.click()}
							class="w-full rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-3 text-sm text-gray-600 transition-colors hover:border-gray-400 hover:bg-gray-100"
						>
							📎 파일 선택 (최대 5개, 각 10MB 이하)
						</button>
						<p class="mt-1 text-xs text-gray-500">
							PDF, Word, 이미지 파일을 첨부할 수 있습니다.
						</p>

						<!-- 첨부된 파일 목록 -->
						{#if attached_files.length > 0}
							<div class="mt-3 space-y-2">
								{#each attached_files as file, index}
									<div
										class="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3"
									>
										<div class="flex min-w-0 flex-1 items-center gap-2">
											<span class="text-lg">📄</span>
											<div class="min-w-0 flex-1">
												<p class="truncate text-sm font-medium text-gray-700">
													{file.name}
												</p>
												<p class="text-xs text-gray-500">
													{format_file_size(file.size)}
												</p>
											</div>
										</div>
										<button
											type="button"
											onclick={() => remove_file(index)}
											class="ml-2 text-gray-400 hover:text-red-600"
										>
											<svg
												class="h-5 w-5"
												fill="currentColor"
												viewBox="0 0 20 20"
											>
												<path
													fill-rule="evenodd"
													d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
													clip-rule="evenodd"
												/>
											</svg>
										</button>
									</div>
								{/each}
							</div>
						{/if}
					</div>

					<!-- 비밀제안 옵션 -->
					<div class="rounded-lg border border-gray-200 p-4">
						<div class="flex items-start gap-3">
							<input
								type="checkbox"
								id="secret_proposal"
								bind:checked={proposal_form.is_secret}
								class="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
							/>
							<div class="flex-1">
								<label
									for="secret_proposal"
									class="cursor-pointer text-sm font-medium text-gray-700"
								>
									비밀제안
								</label>
							</div>
						</div>
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
				<div class="flex justify-between border-t pt-2">
					<p class="font-semibold">서비스 금액</p>
					<p class="text-primary text-lg font-bold">
						{comma(expert_request.reward_amount)}원
					</p>
				</div>
			</div>

			<!-- 입금 계좌 안내 박스 -->
			<div
				class="mt-4 mb-6 rounded-md border border-gray-100 bg-gray-50 p-3 text-sm"
			>
				<div>
					<p class="mb-3 text-base font-semibold">입금 계좌 안내</p>
					<div class="flex">
						<div class="mr-4 flex flex-col gap-1 text-gray-500">
							<p>은행:</p>
							<p>예금주:</p>
							<p>계좌번호:</p>
						</div>
						<div class="flex flex-col gap-1 font-semibold text-gray-900">
							<p>국민은행</p>
							<p>이상민</p>
							<p>939302-00-616198</p>
						</div>
					</div>
				</div>
			</div>

			<button
				onclick={process_payment_and_accept}
				disabled={!is_order_form_valid}
				class=" w-full rounded-xl bg-gray-900 py-4 font-medium text-white transition-colors hover:bg-gray-800 disabled:cursor-not-allowed disabled:bg-gray-300"
			>
				주문하기
			</button>
		</div>
	</Modal>
{/if}

<!-- 리뷰 작성 모달 -->
{#if show_review_modal}
	<Modal
		is_modal_open={show_review_modal}
		modal_position="bottom"
		on:modal_close={() => (show_review_modal = false)}
	>
		<div class="p-6">
			<div class="mb-6 flex items-center justify-between">
				<h3 class="text-lg font-bold text-gray-900">
					{my_review ? '리뷰 수정' : '리뷰 작성'}
				</h3>
				<button
					onclick={() => (show_review_modal = false)}
					class="text-gray-400 hover:text-gray-600"
				>
					<RiCloseLine size={24} />
				</button>
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
						onclick={() => (show_review_modal = false)}
						class="flex-1 rounded-lg bg-gray-100 py-3 font-medium text-gray-600 transition-colors hover:bg-gray-200"
					>
						취소
					</button>
					<button
						type="submit"
						disabled={is_submitting_review}
						class="flex-1 rounded-lg bg-blue-600 py-3 font-medium text-white transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-300"
					>
						{is_submitting_review
							? '제출 중...'
							: my_review
								? '수정하기'
								: '작성하기'}
					</button>
				</div>
			</form>
		</div>
	</Modal>
{/if}

<Bottom_nav />
