<script>
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { RiAddLine, RiHeartFill } from 'svelte-remixicon';

	import Bottom_nav from '$lib/components/ui/Bottom_nav/+page.svelte';
	import Header from '$lib/components/ui/Header/+page.svelte';
	import Icon from '$lib/components/ui/Icon/+page.svelte';
	import Service from '$lib/components/Service/+page.svelte';

	import colors from '$lib/js/colors';
	import { check_login, comma, show_toast } from '$lib/js/common';
	import { api_store } from '$lib/store/api_store';

	const TITLE = '서비스';

	let { data } = $props();
	let { services, service_likes } = $state(data);
	let search_text = $state('');
	let is_infinite_loading = $state(false);
	let last_service_id = $state('');

	onMount(() => {
		last_service_id = services[services.length - 1]?.id || '';
		infinite_scroll();
	});

	/**
	 * 무한스크롤 함수
	 */
	const infinite_scroll = () => {
		const observer = new IntersectionObserver((entries) => {
			entries.forEach((entry) => {
				if (services.length >= 10 && entry.isIntersecting) {
					is_infinite_loading = true;
					setTimeout(() => {
						load_more_data();
					}, 1500);
				}
			});
		});

		const target = document.getElementById('infinite_scroll');
		observer.observe(target);
	};

	/**
	 * 무한스크롤 데이터 더 가져오기
	 */
	const load_more_data = async () => {
		const available_service =
			await $api_store.services.select_infinite_scroll(last_service_id);
		is_infinite_loading = false;

		//더 불러올 값이 있을때만 조회
		if (available_service.length !== 0) {
			services = [...services, ...available_service];

			last_service_id =
				available_service[available_service.length - 1]?.id || '';
		}
	};

	const handle_search = async () => {
		services = await $api_store.services.select_by_search(search_text);
		last_service_id = services[services.length - 1]?.id || '';
	};
</script>

<svelte:head>
	<title>서비스 | 문</title>
	<meta
		name="description"
		content="AI·마케팅·디자인·IT 등 다양한 분야의 전문가 서비스를 찾아보고 이용해보세요. 맞춤형 서비스로 니즈를 해결하세요."
	/>
</svelte:head>

<Header>
	<h1 slot="left" class="font-semibold">{TITLE}</h1>
</Header>

<main>
	<div class="relative w-full px-4">
		<input
			type="text"
			placeholder="서비스 또는 전문가 검색"
			class="block w-full rounded-lg bg-gray-100 p-3 text-sm focus:outline-none"
			bind:value={search_text}
			onkeydown={async (e) => {
				if (e.key === 'Enter') await handle_search();
			}}
		/>
		<button
			class="absolute inset-y-0 right-1 flex items-center pr-5"
			onclick={async () => await handle_search()}
		>
			<Icon attribute="search" size={24} color={colors.gray[500]} />
		</button>
	</div>

	<section>
		<div class="mt-4 grid grid-cols-2 gap-4 px-4">
			{#each services as service}
				<Service {service} {service_likes} />
			{/each}
		</div>

		<div id="infinite_scroll"></div>

		<div class="flex justify-center py-4">
			<div
				class={`border-primary h-8 w-8 animate-spin rounded-full border-t-2 border-b-2 ${
					is_infinite_loading === false ? 'hidden' : ''
				}`}
			></div>
		</div>
	</section>

	<!-- floating right button -->
	<div
		class="fixed bottom-18 z-10 mx-auto flex w-full max-w-screen-md justify-end pr-4"
	>
		<button
			class="rounded-full bg-blue-500 p-3 text-white shadow-lg hover:bg-blue-600"
			onclick={() => {
				if (!check_login()) return;

				window.open('https://forms.gle/WXsjhGa6DUpErz4HA', '_blank');
			}}
		>
			<RiAddLine size={20} color={colors.white} />
		</button>
	</div>
</main>

<Bottom_nav />
