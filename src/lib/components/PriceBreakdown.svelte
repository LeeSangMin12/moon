<script>
	/**
	 * PriceBreakdown - 투명한 견적 내역 컴포넌트
	 *
	 * 전문 견적서 스타일로 작업 내용과 산출물을 보여주어 신뢰도를 높이는 UI
	 */
	import { RiFileList3Line, RiUser3Line, RiTimeLine, RiCheckLine } from 'svelte-remixicon';
	import colors from '$lib/config/colors';
	import { comma } from '$lib/utils/common';

	/**
	 * @typedef {Object} WorkItem
	 * @property {string} title - 작업 항목 이름
	 * @property {string} duration - 진행 기간 (예: "총 4주 (주 2.5일)")
	 * @property {number} price - 해당 항목 가격
	 * @property {string} [worker] - 투입 인원 (예: "마케터 1인")
	 * @property {string} [description] - 업무 설명
	 * @property {string[]} [process] - 진행 예시 단계별 설명
	 * @property {string[]} [deliverables] - 산출물 목록
	 * @property {string[]} [notes] - 확인사항
	 */

	/**
	 * @typedef {Object} Props
	 * @property {WorkItem[]} work_items - 작업 항목 배열
	 * @property {number} total_price - 최종 가격 (원)
	 * @property {string} [expert_name] - 전문가 이름
	 * @property {string} [expert_title] - 전문가 직함
	 * @property {string} [portfolio_url] - 포트폴리오 링크
	 */
	let {
		work_items = [],
		total_price = 0,
		expert_name = '',
		expert_title = '',
		portfolio_url = ''
	} = $props();

	// 선택된 상세보기 항목
	let selected_item_index = $state(null);
</script>

<div class="rounded-xl border border-gray-200 bg-white overflow-hidden">
	<!-- 헤더 -->
	<div class="bg-gray-50 px-4 py-3 border-b border-gray-200">
		<div class="flex items-center justify-between">
			<div class="flex items-center gap-2">
				<RiFileList3Line size={18} color={colors.primary} />
				<span class="text-sm font-semibold text-gray-900">견적 내역서</span>
			</div>
			<div class="text-right">
				<p class="text-xs text-gray-500">총 견적가</p>
				<p class="text-lg font-bold text-primary">₩{comma(total_price)}</p>
			</div>
		</div>
	</div>

	<!-- 테이블 헤더 -->
	<div class="grid grid-cols-12 gap-2 px-4 py-2 bg-gray-50 border-b border-gray-100 text-xs font-medium text-gray-500">
		<div class="col-span-5">업무 내용</div>
		<div class="col-span-3">진행 기간</div>
		<div class="col-span-4 text-right">견적가</div>
	</div>

	<!-- 작업 항목 리스트 -->
	<div class="divide-y divide-gray-100">
		{#each work_items as item, index}
			<div>
				<!-- 요약 행 -->
				<button
					onclick={() => selected_item_index = selected_item_index === index ? null : index}
					class="w-full grid grid-cols-12 gap-2 px-4 py-3 text-left hover:bg-gray-50 transition-colors"
				>
					<div class="col-span-5">
						<p class="text-sm font-medium text-gray-900 leading-tight">{item.title}</p>
						{#if item.worker}
							<p class="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
								<RiUser3Line size={12} />
								{item.worker}
							</p>
						{/if}
					</div>
					<div class="col-span-3 flex items-center">
						<span class="text-xs text-gray-600">{item.duration}</span>
					</div>
					<div class="col-span-4 flex items-center justify-end gap-2">
						<span class="text-sm font-semibold text-gray-900">₩{comma(item.price)}</span>
						<svg
							class="w-4 h-4 text-gray-400 transition-transform duration-200"
							class:rotate-180={selected_item_index === index}
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
						</svg>
					</div>
				</button>

				<!-- 상세 내용 (펼쳐졌을 때) -->
				{#if selected_item_index === index}
					<div class="px-4 pb-4 bg-gray-50/70">
						<div class="space-y-4 pt-2">
							<!-- 업무 설명 -->
							{#if item.description}
								<div>
									<p class="text-xs font-semibold text-gray-700 mb-1">업무 설명</p>
									<p class="text-sm text-gray-600 leading-relaxed">{item.description}</p>
								</div>
							{/if}

							<!-- 진행 예시 -->
							{#if item.process && item.process.length > 0}
								<div>
									<p class="text-xs font-semibold text-gray-700 mb-2">진행 예시</p>
									<div class="space-y-2">
										{#each item.process as step, i}
											<div class="flex gap-2">
												<span class="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-medium">
													{i + 1}
												</span>
												<p class="text-sm text-gray-600 leading-relaxed">{step}</p>
											</div>
										{/each}
									</div>
								</div>
							{/if}

							<!-- 산출물 -->
							{#if item.deliverables && item.deliverables.length > 0}
								<div>
									<p class="text-xs font-semibold text-gray-700 mb-2">산출물</p>
									<div class="flex flex-wrap gap-2">
										{#each item.deliverables as deliverable}
											<span class="inline-flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 text-xs rounded-md">
												<RiCheckLine size={12} />
												{deliverable}
											</span>
										{/each}
									</div>
								</div>
							{/if}

							<!-- 확인사항 -->
							{#if item.notes && item.notes.length > 0}
								<div class="p-3 bg-amber-50 rounded-lg">
									<p class="text-xs font-semibold text-amber-800 mb-1">확인사항</p>
									<ul class="space-y-1">
										{#each item.notes as note}
											<li class="text-xs text-amber-700 leading-relaxed">• {note}</li>
										{/each}
									</ul>
								</div>
							{/if}
						</div>
					</div>
				{/if}
			</div>
		{/each}
	</div>

	<!-- 합계 -->
	<div class="px-4 py-3 bg-gray-900">
		<div class="flex items-center justify-between">
			<span class="text-sm font-medium text-gray-300">총 견적가</span>
			<span class="text-xl font-bold text-white">₩{comma(total_price)}</span>
		</div>
	</div>

	<!-- 전문가 정보 (있으면 표시) -->
	{#if expert_name || expert_title}
		<div class="px-4 py-3 border-t border-gray-200 bg-gray-50">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-3">
					<div class="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
						<RiUser3Line size={20} color={colors.gray[500]} />
					</div>
					<div>
						{#if expert_name}
							<p class="text-sm font-medium text-gray-900">{expert_name}</p>
						{/if}
						{#if expert_title}
							<p class="text-xs text-gray-500">{expert_title}</p>
						{/if}
					</div>
				</div>
				{#if portfolio_url}
					<a
						href={portfolio_url}
						target="_blank"
						rel="noopener noreferrer"
						class="text-xs text-primary font-medium hover:underline"
					>
						포트폴리오 보기
					</a>
				{/if}
			</div>
		</div>
	{/if}
</div>
