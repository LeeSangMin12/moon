<script>
	import { onMount } from 'svelte';

	import FloatingActionButton from '$lib/components/FloatingActionButton/+page.svelte';
	import LoadingSpinner from '$lib/components/LoadingSpinner/+page.svelte';
	import Service from '$lib/components/Service/+page.svelte';

	let { serviceData, infiniteScroll } = $props();

	onMount(() => {
		infiniteScroll.initializeLastId();
		infiniteScroll.setupObserver();
	});
</script>

<section>
	<div class="mt-4 grid grid-cols-2 gap-4 px-4 sm:grid-cols-3">
		{#each serviceData.services as service}
			<Service {service} service_likes={serviceData.serviceLikes} />
		{/each}
	</div>

	<div id="infinite_scroll"></div>

	<LoadingSpinner isLoading={serviceData.isInfiniteLoading} />
</section>

<FloatingActionButton href="/regi/service" />
