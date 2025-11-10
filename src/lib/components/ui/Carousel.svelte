<script>
	import colors from '$lib/config/colors.js';

	import Icon from './Icon.svelte';

	export let images = [];

	let currentIndex = 0;
	const maxDots = 5;
	let showModal = false;
	let modalImage = '';

	const goToSlide = (i) => {
		currentIndex = i;
	};

	const prev = () => {
		currentIndex = (currentIndex - 1 + images.length) % images.length;
	};

	const next = () => {
		currentIndex = (currentIndex + 1) % images.length;
	};

	// 가운데 정렬을 위한 시작 인덱스 계산
	$: startIndex = Math.min(
		Math.max(0, currentIndex - Math.floor(maxDots / 2)),
		Math.max(0, images.length - maxDots),
	);

	// 보여줄 dot 리스트
	$: visibleDots = images.slice(startIndex, startIndex + maxDots);

	const openModal = (img) => {
		modalImage = img;
		showModal = true;
	};

	const closeModal = () => {
		showModal = false;
		modalImage = '';
	};
</script>

<div class="relative w-full overflow-hidden rounded-lg">
	<!-- 이미지 슬라이드 -->
	<div
		class="flex transition-transform duration-500 ease-in-out"
		style="transform: translateX(-{currentIndex * 100}%);"
	>
		{#each images as img, index}
			<div class="flex min-w-full items-center justify-center">
				<button
					type="button"
					class="block h-full max-h-80 w-full cursor-pointer overflow-hidden rounded-lg border-0 bg-transparent p-0"
					onclick={() => openModal(img)}
					aria-label="이미지 크게 보기"
				>
					<img
						src={img}
						alt="게시물 이미지 {index + 1}"
						class="pointer-events-none h-full max-h-80 w-full object-contain"
						draggable="false"
						loading={index === 0 ? 'eager' : 'lazy'}
						decoding="async"
						style="aspect-ratio: 4/3;"
					/>
				</button>
			</div>
		{/each}
	</div>

	<!-- 좌우 버튼 -->
	{#if images.length > 1}
		<button
			onclick={prev}
			class="absolute top-1/2 left-2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
		>
			<Icon attribute="arrow_left" size={20} color={colors.white} />
		</button>
		<button
			onclick={next}
			class="absolute top-1/2 right-2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
		>
			<Icon attribute="arrow_right" size={20} color={colors.white} />
		</button>
	{/if}

	<!-- dot 영역 -->
	<div
		class="absolute bottom-2 left-1/2 z-5 flex -translate-x-1/2 gap-2 rounded-full bg-black/50 px-2 py-1"
	>
		{#each visibleDots as _, i}
			<button
				class="h-1.5 w-1.5 rounded-full transition-all duration-300 ease-in-out"
				class:bg-white={currentIndex === startIndex + i}
				class:bg-gray-400={currentIndex !== startIndex + i}
				class:scale-125={currentIndex === startIndex + i}
				aria-label={`Go to slide ${startIndex + i + 1}`}
				onclick={() => goToSlide(startIndex + i)}
			></button>
		{/each}
	</div>
</div>

{#if showModal}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/70"
		onclick={closeModal}
		role="presentation"
	>
		<div
			class="relative"
			role="dialog"
			tabindex="0"
			onclick={(e) => e.stopPropagation()}
			onkeydown={(e) => {
				if (e.key === 'Escape') closeModal();
			}}
		>
			<img
				src={modalImage}
				alt="이미지 확대보기"
				class="max-h-[80vh] max-w-[90vw] rounded-lg shadow-lg"
				loading="eager"
				decoding="async"
			/>
			<button
				class="absolute top-2 right-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
				onclick={closeModal}
				aria-label="닫기"
			>
				<Icon attribute="close" size={20} color={colors.white} />
			</button>
		</div>
	</div>
{/if}

<!-- 이미지가 1개일때 -->
<!-- <img
			src="https://gscaltexmediahub.com/wp-content/uploads/2023/05/20230523_01_03.jpg"
			alt="Shoes"
			class="aspect-auto max-h-80 w-full rounded-lg object-cover"
		/> -->
