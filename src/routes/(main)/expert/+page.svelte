<script>
	import { onMount } from 'svelte';
	import { RiHeartFill } from 'svelte-remixicon';

	import Bottom_nav from '$lib/components/ui/Bottom_nav/+page.svelte';
	import Header from '$lib/components/ui/Header/+page.svelte';
	import Icon from '$lib/components/ui/Icon/+page.svelte';

	import colors from '$lib/js/colors';
	import { comma } from '$lib/js/common';

	const TITLE = '전문가';

	let { data } = $props();
	let { services } = $derived(data);
</script>

<Header>
	<h1 slot="center" class="font-semibold">{TITLE}</h1>
</Header>

<main>
	<div class="relative w-full px-4">
		<input
			type="text"
			placeholder="서비스 또는 전문가 검색"
			class="block w-full rounded-lg bg-gray-100 p-3 text-sm focus:outline-none"
		/>
		<div
			class="pointer-events-none absolute inset-y-0 right-1 flex items-center pr-5"
		>
			<Icon attribute="search" size={24} color={colors.gray[500]} />
		</div>
	</div>

	<section>
		<div class="mt-4 grid grid-cols-2 gap-4 px-4">
			{#each services as service}
				<!-- 서비스 카드 1 -->

				<a
					href={`/expert/${service.id}`}
					class="overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm"
				>
					<div class="relative">
						<img
							src={service.images[0].uri ||
								'https://img.daisyui.com/images/stock/photo-1625726411847-8cbb60cc71e6.webp'}
							alt={service.title}
							class="h-28 w-full object-cover"
						/>
					</div>
					<div class="px-2 py-2">
						<h3 class="line-clamp-2 text-sm/5 font-medium tracking-tight">
							{service.title}
						</h3>

						<div class="mt-1 flex items-center">
							<div class="flex items-center">
								<Icon attribute="star" size={12} color={colors.primary} />
							</div>

							<span class="text-xs font-medium">{service.rating}</span>
							<span class="ml-1 text-xs text-gray-500">
								({service.rating_count})
							</span>
						</div>

						<div class="mt-1.5 flex items-center justify-between">
							<span class="font-semibold text-gray-900">
								₩{comma(service.price)}
							</span>

							<button>
								<RiHeartFill size={18} color={colors.gray[400]} />
							</button>
						</div>
					</div>
				</a>
			{/each}
		</div>
	</section>
</main>

<Bottom_nav />

<!-- 보통 투자할 때 얼마나 걸렸는지 -->
