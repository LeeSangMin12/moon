<script>
	import { smartGoBack } from '$lib/utils/navigation';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { RiArrowLeftSLine } from 'svelte-remixicon';

	import Header from '$lib/components/ui/Header/+page.svelte';

	import colors from '$lib/js/colors';
	import { check_login, show_toast } from '$lib/js/common';
	import { api_store } from '$lib/store/api_store.js';
	import { update_global_store } from '$lib/store/global_store.js';
	import { user_store } from '$lib/store/user_store.js';

	const TITLE = '전문가 찾기 요청';

	let request_form_data = $state({
		title: '',
		category: '',
		description: '',
		budget_min: '',
		budget_max: '',
		deadline: '',
		attachments: [],
	});

	const categories = [
		'웹개발/프로그래밍',
		'모바일 앱 개발',
		'디자인',
		'마케팅/광고',
		'번역/통역',
		'글쓰기/콘텐츠',
		'영상/사진',
		'음악/오디오',
		'비즈니스 컨설팅',
		'교육/과외',
		'기타',
	];

	onMount(() => {
		// Check if user is logged in when page loads
		if (!check_login()) {
			goto('/login');
			return;
		}
	});

	const add_attachments = (event) => {
		const selected_files = event.target.files;
		let attachments_copy = [...request_form_data.attachments];

		for (let i = 0; i < selected_files.length; i++) {
			selected_files[i].uri = URL.createObjectURL(selected_files[i]);
			attachments_copy.push(selected_files[i]);
		}

		if (attachments_copy.length > 5) {
			show_toast('error', '첨부파일은 최대 5개까지 가능합니다.');
			return;
		}

		request_form_data.attachments = attachments_copy;
	};

	const delete_attachment = (idx) => {
		const updated_attachments = [...request_form_data.attachments];
		updated_attachments.splice(idx, 1);
		request_form_data.attachments = updated_attachments;
	};

	const save_request = async () => {
		// 필수 필드 검증
		if (!request_form_data.title.trim()) {
			show_toast('error', '제목을 입력해주세요.');
			return;
		}
		if (!request_form_data.description.trim()) {
			show_toast('error', '상세 설명을 입력해주세요.');
			return;
		}

		update_global_store('loading', true);
		try {
			// Check if user is logged in
			if (!$user_store?.id) {
				show_toast('error', '로그인이 필요합니다.');
				return;
			}

			// API 호출로 전문가 요청 저장
			const new_request = await $api_store.expert_requests.insert(
				{
					title: request_form_data.title,
					category: request_form_data.category || null,
					description: request_form_data.description,
					budget_min: request_form_data.budget_min
						? parseInt(request_form_data.budget_min)
						: null,
					budget_max: request_form_data.budget_max
						? parseInt(request_form_data.budget_max)
						: null,
					deadline: request_form_data.deadline || null,
				},
				$user_store.id,
			);

			// 성공 메시지 표시
			show_toast('success', '전문가 찾기 요청이 등록되었습니다!');
			goto('/service');
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
	<button slot="left" onclick={smartGoBack}>
		<RiArrowLeftSLine size={28} color={colors.gray[600]} />
	</button>

	<h1 slot="center" class="font-semibold">{TITLE}</h1>

	<button
		slot="right"
		onclick={save_request}
		class="text-sm font-medium text-blue-600 hover:text-blue-700"
	>
		등록
	</button>
</Header>

<main class="p-4">
	<form class="space-y-6">
		<!-- 제목 -->
		<div>
			<label class="mb-2 block text-sm font-medium text-gray-700">
				제목 <span class="text-red-500">*</span>
			</label>
			<input
				type="text"
				bind:value={request_form_data.title}
				placeholder="예: 회사 홈페이지 제작을 도와주실 개발자 찾습니다"
				class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-blue-500 focus:outline-none"
				maxlength="100"
			/>
		</div>

		<!-- 카테고리 -->
		<div>
			<label class="mb-2 block text-sm font-medium text-gray-700">
				분야/카테고리
			</label>
			<select
				bind:value={request_form_data.category}
				class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-blue-500 focus:outline-none"
			>
				<option value="">분야를 선택해주세요</option>
				{#each categories as category}
					<option value={category}>{category}</option>
				{/each}
			</select>
		</div>

		<!-- 상세 설명 -->
		<div>
			<label class="mb-2 block text-sm font-medium text-gray-700">
				상세 설명 <span class="text-red-500">*</span>
			</label>
			<textarea
				bind:value={request_form_data.description}
				placeholder="어떤 작업이 필요한지 자세히 설명해주세요.&#10;프로젝트의 목적, 요구사항, 원하는 결과물 등을 포함해주시면 더 정확한 제안을 받을 수 있습니다."
				class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-blue-500 focus:outline-none"
				rows="8"
			></textarea>
		</div>

		<!-- 예산 범위 -->
		<div>
			<label class="mb-2 block text-sm font-medium text-gray-700">
				예산 범위 (원)
			</label>
			<div class="flex items-center space-x-2">
				<input
					type="number"
					bind:value={request_form_data.budget_min}
					placeholder="최소 예산"
					class="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-blue-500 focus:outline-none"
					min="0"
				/>
				<span class="text-gray-500">~</span>
				<input
					type="number"
					bind:value={request_form_data.budget_max}
					placeholder="최대 예산"
					class="flex-1 rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-blue-500 focus:outline-none"
					min="0"
				/>
			</div>
			<p class="mt-1 text-xs text-gray-500">
				예산 범위를 입력하시면 더 정확한 제안을 받을 수 있습니다
			</p>
		</div>

		<!-- 완료 희망일 -->
		<div>
			<label class="mb-2 block text-sm font-medium text-gray-700">
				완료 희망일
			</label>
			<input
				type="date"
				bind:value={request_form_data.deadline}
				class="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-blue-500 focus:outline-none"
				min={new Date().toISOString().split('T')[0]}
			/>
		</div>

		<!-- 첨부파일 -->
		<div>
			<label class="mb-2 block text-sm font-medium text-gray-700">
				참고자료 첨부
			</label>
			<div
				class="rounded-lg border-2 border-dashed border-gray-300 p-6 text-center"
			>
				<input
					type="file"
					multiple
					accept="image/*,.pdf,.doc,.docx,.txt"
					onchange={add_attachments}
					class="hidden"
					id="attachment-upload"
				/>
				<label for="attachment-upload" class="cursor-pointer">
					<div class="text-gray-400">
						<svg
							class="mx-auto mb-2 h-8 w-8"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
							></path>
						</svg>
						<p class="text-sm">클릭하여 파일 업로드</p>
						<p class="text-xs text-gray-500">
							이미지, PDF, 문서 파일 (최대 5개)
						</p>
					</div>
				</label>
			</div>

			<!-- 첨부파일 미리보기 -->
			{#if request_form_data.attachments.length > 0}
				<div class="mt-4 space-y-2">
					{#each request_form_data.attachments as attachment, idx}
						<div
							class="flex items-center justify-between rounded-md bg-gray-50 p-2"
						>
							<span class="truncate text-sm">{attachment.name}</span>
							<button
								type="button"
								onclick={() => delete_attachment(idx)}
								class="text-red-500 hover:text-red-700"
							>
								<svg
									class="h-4 w-4"
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
					{/each}
				</div>
			{/if}
		</div>

		<!-- 주의사항 -->
		<div class="rounded-md border border-blue-200 bg-blue-50 p-4">
			<h3 class="mb-2 text-sm font-medium text-blue-800">📝 작성 팁</h3>
			<ul class="space-y-1 text-xs text-blue-700">
				<li>• 프로젝트의 목적과 목표를 명확히 설명해주세요</li>
				<li>• 원하는 결과물이나 스타일을 구체적으로 기술해주세요</li>
				<li>• 참고할 만한 사례나 자료가 있다면 첨부해주세요</li>
				<li>• 예산과 일정을 미리 정해두시면 더 나은 제안을 받을 수 있어요</li>
			</ul>
		</div>
	</form>
</main>
