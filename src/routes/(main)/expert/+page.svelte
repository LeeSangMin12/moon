<script>
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { RiHeartFill } from 'svelte-remixicon';

	import Bottom_nav from '$lib/components/ui/Bottom_nav/+page.svelte';
	import Header from '$lib/components/ui/Header/+page.svelte';
	import Icon from '$lib/components/ui/Icon/+page.svelte';

	import colors from '$lib/js/colors';

	const TITLE = '전문가';
</script>

<Header>
	<h1 slot="left" class="text-xl font-bold">{TITLE}</h1>
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
			<!-- 서비스 카드 1 -->
			<div
				class="overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm"
			>
				<div class="relative">
					<img
						src="https://readdy.ai/api/search-image?query=professional%2520web%2520developer%2520working%2520on%2520React%2520code%252C%2520modern%2520workspace%252C%2520clean%2520desk%2520setup%252C%2520multiple%2520monitors%2520showing%2520code%252C%2520high-quality%2520detailed%2520photo%252C%2520soft%2520lighting&width=400&height=225&seq=101&orientation=landscape"
						alt="React 컴포넌트 최적화"
						class="h-28 w-full object-cover"
					/>
				</div>
				<div class="px-2 py-2">
					<h3 class="line-clamp-2 text-sm/5 font-medium tracking-tight">
						React 컴포넌트 최적화 코드 리뷰
					</h3>

					<div class="mt-1 flex items-center">
						<div class="flex items-center">
							<Icon attribute="star" size={12} color={colors.primary} />
						</div>

						<span class="text-xs font-medium">4.9</span>
						<span class="ml-1 text-xs text-gray-500">(327)</span>
					</div>

					<div class="mt-1.5 flex items-center justify-between">
						<span class="font-semibold text-gray-900">₩50,000</span>

						<button>
							<RiHeartFill size={18} color={colors.gray[400]} />
						</button>
					</div>
				</div>
			</div>
		</div>
	</section>
</main>

<Bottom_nav />

<!-- 보통 투자할 때 얼마나 걸렸는지 -->
