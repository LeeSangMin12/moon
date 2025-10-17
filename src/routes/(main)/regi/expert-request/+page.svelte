<script>
	import { smartGoBack } from '$lib/utils/navigation';
	import Select from 'svelte-select';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { RiArrowLeftSLine } from 'svelte-remixicon';
	import { page } from '$app/stores';

	import Date_picker from '$lib/components/ui/Date_picker.svelte';
	import Date_range_picker from '$lib/components/ui/Date_range_picker.svelte';
	import Header from '$lib/components/ui/Header.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import SimpleEditor from '$lib/components/tiptap-templates/simple/simple-editor.svelte';

	import colors from '$lib/config/colors';
	import { check_login, show_toast } from '$lib/utils/common';
	import { get_user_context, get_api_context } from '$lib/contexts/app-context.svelte.js';
	import { update_global_store } from '$lib/store/global_store.js';

	const { me } = get_user_context();
	const { api } = get_api_context();

	let is_date_range_modal = $state(false);
	let is_date_picker_modal = $state(false);

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
		application_deadline: null,
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

	const categories = [
		{ value: '웹개발/프로그래밍', label: '웹개발/프로그래밍' },
		{ value: '모바일 앱 개발', label: '모바일 앱 개발' },
		{ value: '디자인', label: '디자인' },
		{ value: '마케팅/광고', label: '마케팅/광고' },
		{ value: '번역/통역', label: '번역/통역' },
		{ value: '글쓰기/콘텐츠', label: '글쓰기/콘텐츠' },
		{ value: '영상/사진', label: '영상/사진' },
		{ value: '음악/오디오', label: '음악/오디오' },
		{ value: '비즈니스 컨설팅', label: '비즈니스 컨설팅' },
		{ value: '교육/과외', label: '교육/과외' },
		{ value: '기타', label: '기타' },
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
			const matching_job_type = job_types.find(jt => jt.value === job_type_param);
			if (matching_job_type) {
				selected_job_type = matching_job_type;
				request_form_data.job_type = job_type_param;
			}
		}
	});

	let current_step = $state(1);
	const total_steps = 4;

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
				if (!request_form_data.application_deadline) {
					show_toast('error', '모집 마감일을 선택해주세요.');
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
			// Check if user is logged in
			if (!me?.id) {
				show_toast('error', '로그인이 필요합니다.');
				return;
			}

			// API 호출로 전문가 요청 저장 (draft 상태)
			const new_request = await api.expert_requests.insert(
				{
					title: request_form_data.title,
					category: selected_category?.value,
					description: request_form_data.description,
					reward_amount: parseInt(request_form_data.reward_amount),
					price_unit: request_form_data.price_unit,
					application_deadline: request_form_data.application_deadline
						? request_form_data.application_deadline.toISOString().split('T')[0]
						: null,
					work_start_date: request_form_data.work_start_date || null,
					work_end_date: request_form_data.work_end_date || null,
					max_applicants: parseInt(request_form_data.max_applicants),
					work_location: request_form_data.work_location,
					job_type: selected_job_type?.value || 'sidejob',
				},
				me.id,
			);

			// 결제 페이지로 리다이렉트
			goto(`/expert-request/checkout?request_id=${new_request.id}`);
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
				smartGoBack();
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
						class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-blue-500"
						maxlength="100"
					/>
				</div>

				<!-- 상세 설명 -->
				<div>
					<label class="mb-2 block text-sm font-medium text-gray-700">
						상세 설명
					</label>
					<div class="mt-2">
						<SimpleEditor bind:content={request_form_data.description} />
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
						보상금 (원)
					</label>
					<div class="flex gap-2">
						<input
							type="number"
							bind:value={request_form_data.reward_amount}
							placeholder="예: 500000"
							class="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-blue-500"
							min="10000"
						/>
						<select
							bind:value={request_form_data.price_unit}
							class="w-28 rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-blue-500"
						>
							{#each price_unit_options as option}
								<option value={option.value}>{option.label}</option>
							{/each}
						</select>
					</div>
					<p class="mt-1 text-xs text-gray-500">
						최소 10,000원 이상 입력해주세요
					</p>
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
						class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-blue-500"
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
						class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-blue-500"
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

				<!-- 모집 마감일 -->
				<button
					onclick={() => (is_date_picker_modal = true)}
					class="flex w-full flex-col border-b border-gray-300 pb-2"
				>
					<p class="mb-4 block self-start text-sm font-medium text-gray-700">
						모집 마감일
					</p>

					<div class="flex w-full items-center justify-between text-gray-900">
						{#if request_form_data.application_deadline !== null}
							<p>
								{format_date(request_form_data.application_deadline)}
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

				<!-- 요약 정보 -->
				<!-- <div class="rounded-md border border-blue-200 bg-blue-50 p-4">
					<h3 class="mb-2 text-sm font-medium text-blue-800">
						📋 요청 정보 확인
					</h3>
					<div class="space-y-2 text-xs text-blue-700">
						<div>
							<strong>제목:</strong>
							{request_form_data.title || '미입력'}
						</div>
						<div>
							<strong>카테고리:</strong>
							{selected_category?.label || '미선택'}
						</div>
						<div>
							<strong>보상금:</strong>
							{request_form_data.reward_amount
								? `${price_unit_options.find(o => o.value === request_form_data.price_unit)?.label || '건당'} ${parseInt(request_form_data.reward_amount).toLocaleString()}원`
								: '미입력'}
						</div>
						<div>
							<strong>모집인원:</strong>
							{request_form_data.max_applicants || '미입력'}명
						</div>
						<div>
							<strong>근무지:</strong>
							{request_form_data.work_location || '미입력'}
						</div>
					</div>
				</div> -->
			</div>
		{:else if current_step === 4}
			<!-- Step 4: 요청 정보 확인 -->
			<div class="space-y-6">
				<div class="mb-6">
					<h2 class="mb-4 text-lg font-semibold text-gray-900">
						요청 정보를<br />
						확인해주세요
					</h2>
				</div>

				<!-- 기본 정보 카드 -->
				<div class="rounded-2xl bg-gray-50 p-6">
					<h3 class="mb-4 text-base font-semibold text-gray-900">기본 정보</h3>

					<!-- 카테고리 칩 -->
					{#if selected_category}
						<div class="mb-4">
							<span
								class="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800"
							>
								{selected_category.label}
							</span>
						</div>
					{/if}

					<div class="space-y-3">
						<div>
							<p class="text-sm text-gray-600">프로젝트 제목</p>
							<p class="mt-1 font-medium text-gray-900">
								{request_form_data.title}
							</p>
						</div>
						<div>
							<p class="text-sm text-gray-600">상세 설명</p>

							<div class="mt-1 prose prose-sm max-w-none leading-relaxed text-gray-900">
								{@html request_form_data.description}
							</div>
							<!-- <p class="mt-1 leading-relaxed text-gray-900">
								{request_form_data.description}
							</p> -->
						</div>
					</div>
				</div>

				<!-- 조건 정보 카드 -->
				<div class="rounded-2xl bg-gray-50 p-6">
					<h3 class="mb-4 text-base font-semibold text-gray-900">조건 정보</h3>
					<div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
						<div class="rounded-xl bg-white p-4">
							<p class="text-sm text-gray-600">보상금</p>
							<p class="mt-1 text-lg font-bold text-gray-900">
								{price_unit_options.find(o => o.value === request_form_data.price_unit)?.label || '건당'} {parseInt(request_form_data.reward_amount).toLocaleString()}원
							</p>
						</div>
						<div class="rounded-xl bg-white p-4">
							<p class="text-sm text-gray-600">모집인원</p>
							<p class="mt-1 text-lg font-bold text-gray-900">
								{request_form_data.max_applicants}명
							</p>
						</div>
						<div class="rounded-xl bg-white p-4">
							<p class="text-sm text-gray-600">근무지</p>
							<p class="mt-1 text-lg font-bold text-gray-900">
								{request_form_data.work_location}
							</p>
						</div>
					</div>
				</div>

				<!-- 일정 정보 카드 -->
				<div class="rounded-2xl bg-gray-50 p-6">
					<h3 class="mb-4 text-base font-semibold text-gray-900">일정 정보</h3>
					<div class="space-y-4">
						{#if request_form_data.application_deadline}
							<div class="rounded-xl bg-white p-4">
								<p class="text-sm text-gray-600">모집 마감일</p>
								<p class="mt-1 font-medium text-gray-900">
									{format_date(request_form_data.application_deadline)}
								</p>
							</div>
						{/if}
						{#if request_form_data.work_start_date && request_form_data.work_end_date}
							<div class="rounded-xl bg-white p-4">
								<p class="text-sm text-gray-600">예상 업무 기간</p>
								<p class="mt-1 font-medium text-gray-900">
									{format_date(request_form_data.work_start_date)} ~ {format_date(
										request_form_data.work_end_date,
									)}
								</p>
							</div>
						{/if}
						{#if !request_form_data.application_deadline && (!request_form_data.work_start_date || !request_form_data.work_end_date)}
							<div
								class="rounded-xl border-2 border-dashed border-gray-300 p-4 text-center"
							>
								<p class="text-gray-500">설정된 일정이 없습니다</p>
							</div>
						{/if}
					</div>
				</div>
			</div>
		{/if}
	</form>

	<div class="fixed bottom-0 w-full max-w-screen-md bg-white p-4">
		<div class="pb-safe">
			{#if current_step === total_steps}
				<button onclick={save_request} class="btn btn-primary w-full">
					등록
				</button>
			{:else}
				<button onclick={handle_next} class="btn btn-primary w-full">
					다음
				</button>
			{/if}
		</div>
	</div>
</main>

<Modal bind:is_modal_open={is_date_range_modal} modal_position="bottom">
	<div class="flex flex-col items-center">
		<p class="mt-10 text-lg font-semibold">조사기간</p>

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

<Modal bind:is_modal_open={is_date_picker_modal} modal_position="bottom">
	<div class="flex flex-col items-center">
		<p class="mt-10 text-lg font-semibold">모집 마감일</p>

		<div class="mt-6 w-full max-w-96 px-5">
			<Date_picker
				bind:selected_date={request_form_data.application_deadline}
			/>
		</div>

		<div class="pb-safe mt-12 mb-3.5 w-full px-5">
			<button
				onclick={() => (is_date_picker_modal = false)}
				class="btn btn-primary w-full">확인</button
			>
		</div>
	</div>
</Modal>
