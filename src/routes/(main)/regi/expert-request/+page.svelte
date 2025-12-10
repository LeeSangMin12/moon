<script>
	import colors from '$lib/config/colors';
	import {
		get_api_context,
		get_user_context,
	} from '$lib/contexts/app_context.svelte.js';
	import { check_login, comma, show_toast, to_local_date_string } from '$lib/utils/common';
	import { smart_go_back } from '$lib/utils/navigation';
	import Select from 'svelte-select';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { RiArrowLeftSLine } from 'svelte-remixicon';

	import Date_range_picker from '$lib/components/ui/Date_range_picker.svelte';
	import Header from '$lib/components/ui/Header.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import SimpleEditor from '$lib/components/tiptap-templates/simple/simple-editor.svelte';

	import { update_global_store } from '$lib/store/global_store.js';

	const me = get_user_context();
	const api = get_api_context();

	let is_date_range_modal = $state(false);
	let is_posting_date_modal = $state(false);
	let is_confirm_modal = $state(false);

	const format_date = (date) => {
		return `${date?.getFullYear() - 2000}년 ${date?.getMonth() + 1}월 ${date?.getDate()}일`;
	};

	const TITLE = '전문가 찾기 요청';

	let request_form_data = $state({
		title: '',
		category: '',
		description: '',
		reward_amount: '',
		price_unit: 'per_project',
		posting_start_date: null,
		posting_end_date: null,
		work_start_date: null,
		work_end_date: null,
		max_applicants: 1,
		work_location: '',
		job_type: 'sidejob',
	});

	const price_unit_options = [
		{ value: 'per_project', label: '건당' },
		{ value: 'per_hour', label: '시간당' },
		{ value: 'per_page', label: '장당' },
		{ value: 'per_day', label: '일당' },
		{ value: 'per_month', label: '월' },
		{ value: 'per_year', label: '년' },
	];

	let selected_price_unit = $state(price_unit_options[0]);
	let price_type = $state('direct'); // 'direct' | 'quote'

	const categories = [
		{ value: '제품/서비스 개발', label: '제품/서비스 개발' },
		{ value: '브랜딩 & 디자인', label: '브랜딩 & 디자인' },
		{ value: '마케팅', label: '마케팅' },
		{ value: '리서치', label: '리서치' },
		{ value: '데이터 & 자동화', label: '데이터 & 자동화' },
		{ value: '컨실팅 & 강연', label: '컨실팅 & 강연' },
		{ value: '문서 작성', label: '문서 작성' },
		{ value: '미디어 (영상 & 음악)', label: '미디어 (영상 & 음악)' },
		{ value: '번역', label: '번역' },
	];

	const job_types = [
		{ value: 'sidejob', label: '사이드잡' },
		{ value: 'fulltime', label: '풀타임잡' },
	];

	let selected_category = $state(null);
	let selected_job_type = $state(job_types[0]);

	onMount(() => {
		// Check if user is logged in when page loads
		if (!check_login(me)) {
			goto('/login');
			return;
		}

		// URL 파라미터에서 job_type 읽기
		const job_type_param = $page.url.searchParams.get('job_type');
		if (job_type_param) {
			const matching_job_type = job_types.find(
				(jt) => jt.value === job_type_param,
			);
			if (matching_job_type) {
				selected_job_type = matching_job_type;
				request_form_data.job_type = job_type_param;
			}
		}
	});

	let current_step = $state(1);
	const total_steps = 3;

	const go_to_next_step = () => {
		if (current_step < total_steps) {
			current_step++;
		}
	};

	const go_to_prev_step = () => {
		if (current_step > 1) {
			current_step--;
		}
	};

	const validate_step = (step) => {
		switch (step) {
			case 1:
				if (!request_form_data.title.trim()) {
					show_toast('error', '제목을 입력해주세요.');
					return false;
				}
				if (!selected_category) {
					show_toast('error', '카테고리를 선택해주세요.');
					return false;
				}
				if (!request_form_data.description.trim()) {
					show_toast('error', '상세 설명을 입력해주세요.');
					return false;
				}
				return true;
			case 2:
				if (price_type === 'direct') {
					if (
						!request_form_data.reward_amount ||
						request_form_data.reward_amount === ''
					) {
						show_toast('error', '보상금을 입력해주세요.');
						return false;
					}
					const reward = parseInt(request_form_data.reward_amount);
					if (isNaN(reward) || reward < 10000) {
						show_toast('error', '보상금은 10,000원 이상 입력해주세요.');
						return false;
					}
				}
				if (
					!request_form_data.max_applicants ||
					request_form_data.max_applicants === ''
				) {
					show_toast('error', '모집인원을 입력해주세요.');
					return false;
				}
				const applicants = parseInt(request_form_data.max_applicants);
				if (isNaN(applicants) || applicants < 1) {
					show_toast('error', '모집인원은 1명 이상 입력해주세요.');
					return false;
				}
				if (!request_form_data.work_location.trim()) {
					show_toast('error', '근무지를 입력해주세요.');
					return false;
				}
				return true;
			case 3:
				if (
					!request_form_data.posting_start_date ||
					!request_form_data.posting_end_date
				) {
					show_toast('error', '프로젝트 공고일을 선택해주세요.');
					return false;
				}
				if (
					!request_form_data.work_start_date ||
					!request_form_data.work_end_date
				) {
					show_toast('error', '예상 업무 기간을 선택해주세요.');
					return false;
				}
				return true;
			default:
				return true;
		}
	};

	const handle_next = () => {
		if (validate_step(current_step)) {
			go_to_next_step();
		}
	};

	const save_request = async () => {
		update_global_store('loading', true);
		try {
			if (!me?.id) {
				show_toast('error', '로그인이 필요합니다.');
				return;
			}

			// API 호출로 전문가 요청 저장 (무료 등록)
			const new_request = await api.expert_requests.insert(
				{
					title: request_form_data.title,
					category: selected_category?.value,
					description: request_form_data.description,
					reward_amount:
						price_type === 'quote'
							? null
							: parseInt(request_form_data.reward_amount),
					price_unit:
						price_type === 'quote'
							? 'quote'
							: selected_price_unit?.value || 'per_project',
					posting_start_date: to_local_date_string(request_form_data.posting_start_date),
					application_deadline: to_local_date_string(request_form_data.posting_end_date),
					work_start_date: to_local_date_string(request_form_data.work_start_date),
					work_end_date: to_local_date_string(request_form_data.work_end_date),
					max_applicants: parseInt(request_form_data.max_applicants),
					work_location: request_form_data.work_location,
					job_type: selected_job_type?.value || 'sidejob',
				},
				me.id,
			);

			show_toast('success', '공고가 등록되었습니다!');
			goto('/expert/accounts', { replaceState: true });
		} catch (e) {
			console.error('Error saving expert request:', e);
			show_toast('error', '요청 등록 중 오류가 발생했습니다.');
		} finally {
			update_global_store('loading', false);
		}
	};
</script>

<svelte:head>
	<title>{TITLE} | 문</title>
	<meta
		name="description"
		content="전문가를 찾고 계신가요? 원하는 작업을 설명하고 전문가들의 제안을 받아보세요."
	/>
</svelte:head>

<Header>
	<button
		slot="left"
		onclick={() => {
			if (current_step > 1) {
				go_to_prev_step();
			} else {
				smart_go_back();
			}
		}}
	>
		<RiArrowLeftSLine size={28} color={colors.gray[600]} />
	</button>

	<h1 slot="center" class="font-semibold">{TITLE}</h1>
</Header>
<!-- Progress bar -->
<div class="mb-4">
	<div class="h-1 w-full rounded-full bg-gray-200">
		<div
			class="h-1 rounded-lg bg-blue-600 transition-all duration-300"
			style="width: {(current_step / total_steps) * 100}%"
		></div>
	</div>
</div>

<main class="p-4">
	<form class="space-y-6">
		{#if current_step === 1}
			<!-- Step 1: 기본 정보 -->
			<div class="space-y-6">
				<h2 class="mb-4 text-lg font-semibold text-gray-900">
					찾으시는 전문가의
					<br />
					기본 정보를 작성해주세요
				</h2>

				<!-- 작업 유형 -->
				<div>
					<label class="mb-2 block text-sm font-medium text-gray-700">
						작업 유형
					</label>
					<Select
						items={job_types}
						bind:value={selected_job_type}
						placeholder="작업 유형을 선택해주세요"
						clearable={false}
						searchable={false}
						showChevron={true}
						--border="1px solid #d1d5db"
						--border-radius="6px"
						--border-focused="1px solid #3b82f6"
					/>
				</div>

				<!-- 카테고리 -->
				<div>
					<label class="mb-2 block text-sm font-medium text-gray-700">
						분야/카테고리
					</label>
					<Select
						items={categories}
						bind:value={selected_category}
						placeholder="분야를 선택해주세요"
						clearable={false}
						searchable={true}
						showChevron={true}
						--border="1px solid #d1d5db"
						--border-radius="6px"
						--border-focused="1px solid #3b82f6"
					/>
				</div>

				<!-- 제목 -->
				<div>
					<label class="mb-2 block text-sm font-medium text-gray-700">
						프로젝트 제목
					</label>
					<input
						type="text"
						bind:value={request_form_data.title}
						placeholder="예: 회사 홈페이지 제작을 도와주실 개발자 찾습니다"
						class="focus:border-primary w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none"
						maxlength="100"
					/>
				</div>

				<!-- 상세 설명 -->
				<div>
					<label class="mb-2 block text-sm font-medium text-gray-700">
						상세 설명
					</label>
					<div class="mt-2">
						<SimpleEditor
							placeholder={`어떤 작업이 필요한지 자세히 설명해주세요.
					프로젝트의 목적, 요구사항, 원하는 결과물 등을 포함해주시면 더 정확한 제안을 받을 수 있습니다.`}
							bind:content={request_form_data.description}
						/>
					</div>
					<!-- <textarea
						bind:value={request_form_data.description}
						placeholder="어떤 작업이 필요한지 자세히 설명해주세요.&#10;프로젝트의 목적, 요구사항, 원하는 결과물 등을 포함해주시면 더 정확한 제안을 받을 수 있습니다."
						class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-blue-500"
						rows="8"
					></textarea> -->
				</div>
			</div>
		{:else if current_step === 2}
			<!-- Step 2: 조건 설정 -->
			<div class="space-y-6">
				<h2 class="mb-4 text-lg font-semibold text-gray-900">
					찾으시는 전문가의 <br /> 조건을 설정해주세요
				</h2>

				<!-- 보상금 -->
				<div>
					<label class="mb-2 block text-sm font-medium text-gray-700">
						보상금
					</label>
					<div class="mb-3 flex gap-3">
						<label class="flex cursor-pointer items-center gap-2">
							<input
								type="radio"
								name="price_type"
								value="direct"
								checked={price_type === 'direct'}
								onchange={() => (price_type = 'direct')}
								class="h-4 w-4 text-blue-600"
							/>
							<span class="text-sm text-gray-700">직접 입력</span>
						</label>
						<label class="flex cursor-pointer items-center gap-2">
							<input
								type="radio"
								name="price_type"
								value="quote"
								checked={price_type === 'quote'}
								onchange={() => (price_type = 'quote')}
								class="h-4 w-4 text-blue-600"
							/>
							<span class="text-sm text-gray-700">제안 받기</span>
						</label>
					</div>
					{#if price_type === 'direct'}
						<div class="flex gap-2">
							<input
								type="text"
								inputmode="numeric"
								value={request_form_data.reward_amount
									? comma(request_form_data.reward_amount)
									: ''}
								oninput={(e) => {
									request_form_data.reward_amount = e.target.value.replace(
										/,/g,
										'',
									);
								}}
								placeholder="예: 500,000"
								class="focus:border-primary min-w-0 flex-1 rounded-md border border-gray-300 px-3 py-2 focus:outline-none"
							/>
							<div class="w-32 shrink-0">
								<Select
									items={price_unit_options}
									bind:value={selected_price_unit}
									placeholder="단위"
									clearable={false}
									searchable={false}
									showChevron={true}
									--border="1px solid #d1d5db"
									--border-radius="6px"
									--border-focused="1px solid #3b82f6"
								/>
							</div>
						</div>
					{:else}
						<p class="rounded-md bg-gray-50 px-3 py-3 text-sm text-gray-500">
							전문가들의 금액 제안을 받습니다. 제안받은 금액을 검토 후 선택할 수
							있습니다.
						</p>
					{/if}
				</div>

				<!-- 모집인원 -->
				<div>
					<label class="mb-2 block text-sm font-medium text-gray-700">
						모집인원
					</label>
					<input
						type="number"
						bind:value={request_form_data.max_applicants}
						placeholder="예: 1"
						class="focus:border-primary w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none"
						min="1"
						max="100"
					/>
				</div>

				<!-- 근무지 -->
				<div>
					<label class="mb-2 block text-sm font-medium text-gray-700">
						근무지
					</label>
					<input
						type="text"
						bind:value={request_form_data.work_location}
						placeholder="예: 서울시 강남구, 원격근무, 온라인"
						class="focus:border-primary w-full rounded-md border border-gray-300 px-3 py-2 focus:outline-none"
						maxlength="100"
					/>
				</div>
			</div>
		{:else if current_step === 3}
			<!-- Step 3: 일정 설정 -->
			<div class="space-y-6">
				<h2 class="mb-4 text-lg font-semibold text-gray-900">
					프로젝트 일정을 설정해주세요
				</h2>

				<!-- 프로젝트 공고일 -->
				<button
					onclick={() => (is_posting_date_modal = true)}
					class="flex w-full flex-col border-b border-gray-300 pb-2"
				>
					<p class="mb-4 block self-start text-sm font-medium text-gray-700">
						프로젝트 공고일
					</p>

					<div class="flex w-full items-center justify-between text-gray-900">
						{#if request_form_data.posting_start_date !== null && request_form_data.posting_end_date !== null}
							<p>
								{format_date(request_form_data.posting_start_date)} ~
								{format_date(request_form_data.posting_end_date)}
							</p>
						{:else}
							<p class="text-gray-500">선택중..</p>
						{/if}
						<svg
							width="7"
							height="13"
							viewBox="0 0 7 13"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								d="M0.998535 11.1914L5.99853 6.19141L0.998535 1.19141"
								stroke="#909090"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					</div>
				</button>

				<button
					onclick={() => (is_date_range_modal = true)}
					class="mt-6 flex w-full flex-col border-b border-gray-300 pb-2"
				>
					<p class="mb-4 block self-start text-sm font-medium text-gray-700">
						예상 업무 기간
					</p>

					<div class="flex w-full items-center justify-between text-gray-900">
						{#if request_form_data.work_start_date !== null && request_form_data.work_end_date !== null}
							<p>
								{format_date(request_form_data.work_start_date)} ~
								{format_date(request_form_data.work_end_date)}
							</p>
						{:else}
							<p class="text-gray-500">선택중..</p>
						{/if}
						<svg
							width="7"
							height="13"
							viewBox="0 0 7 13"
							fill="none"
							xmlns="http://www.w3.org/2000/svg"
						>
							<path
								d="M0.998535 11.1914L5.99853 6.19141L0.998535 1.19141"
								stroke="#909090"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
							/>
						</svg>
					</div>
				</button>

				<!-- 업무 예상 시작일 -->
				<!-- <div>
					<label class="mb-2 block text-sm font-medium text-gray-700">
						업무 예상 시작일
					</label>
					<input
						type="date"
						bind:value={request_form_data.work_start_date}
						class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-blue-500"
						min={new Date().toISOString().split('T')[0]}
					/>
				</div> -->

				<!-- 업무 예상 종료일 -->
				<!-- <div>
					<label class="mb-2 block text-sm font-medium text-gray-700">
						업무 예상 종료일
					</label>
					<input
						type="date"
						bind:value={request_form_data.work_end_date}
						class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-blue-500"
						min={request_form_data.work_start_date ||
							new Date().toISOString().split('T')[0]}
					/>
				</div> -->
			</div>
		{/if}
	</form>

	<div
		class="fixed right-0 bottom-0 left-0 mx-auto w-full max-w-screen-md bg-white p-4"
	>
		<div class="pb-safe">
			{#if current_step === total_steps}
				<button
					onclick={() => {
						if (validate_step(3)) {
							is_confirm_modal = true;
						}
					}}
					class="btn btn-primary w-full"
				>
					등록하기
				</button>
			{:else}
				<button onclick={handle_next} class="btn btn-primary w-full">
					다음
				</button>
			{/if}
		</div>
	</div>
</main>

<!-- 프로젝트 공고일 모달 -->
<Modal bind:is_modal_open={is_posting_date_modal} modal_position="bottom">
	<div class="flex flex-col items-center">
		<p class="mt-10 text-lg font-semibold">프로젝트 공고일</p>
		<p class="mt-1 text-sm text-gray-500">공고가 노출될 기간을 선택해주세요</p>

		<div class="mt-6 w-full max-w-96 px-5">
			<Date_range_picker
				bind:start_date={request_form_data.posting_start_date}
				bind:end_date={request_form_data.posting_end_date}
			/>
		</div>

		<div class="pb-safe mt-8 mb-3.5 w-full px-5">
			<button
				onclick={() => (is_posting_date_modal = false)}
				class="btn btn-primary w-full">확인</button
			>
		</div>
	</div>
</Modal>

<!-- 예상 업무 기간 모달 -->
<Modal bind:is_modal_open={is_date_range_modal} modal_position="bottom">
	<div class="flex flex-col items-center">
		<p class="mt-10 text-lg font-semibold">예상 업무 기간</p>

		<div class="mt-6 w-full max-w-96 px-5">
			<Date_range_picker
				bind:start_date={request_form_data.work_start_date}
				bind:end_date={request_form_data.work_end_date}
			/>
		</div>

		<div class="pb-safe mt-12 mb-3.5 w-full px-5">
			<button
				onclick={() => (is_date_range_modal = false)}
				class="btn btn-primary w-full">확인</button
			>
		</div>
	</div>
</Modal>

<!-- 등록 확인 모달 -->
<Modal bind:is_modal_open={is_confirm_modal} modal_position="center">
	<div class="p-6">
		<h3 class="text-lg font-semibold text-gray-900">
			공고를 등록하시겠습니까?
		</h3>
		<p class="mt-2 text-sm text-gray-500">등록 후 바로 공고가 게시됩니다.</p>

		<div class="mt-6 flex gap-3">
			<button
				onclick={() => (is_confirm_modal = false)}
				class="flex-1 rounded-lg bg-gray-100 py-3 text-[14px] font-medium text-gray-700 active:bg-gray-200"
			>
				취소
			</button>
			<button
				onclick={() => {
					is_confirm_modal = false;
					save_request();
				}}
				class="flex-1 rounded-lg bg-blue-500 py-3 text-[14px] font-medium text-white active:bg-blue-600 disabled:bg-gray-300 disabled:text-gray-500"
			>
				등록하기
			</button>
		</div>
	</div>
</Modal>
