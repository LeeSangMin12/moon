<script>
	import Icon from '$lib/components/ui/Icon/+page.svelte';
	import colors from '$lib/js/colors';

	let { title, description, icon = 'search' } = $props();
</script>

<div class="rounded-2xl border border-gray-100 bg-white p-8 text-center">
	<div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
		<Icon attribute={icon} size={24} color={colors.gray[400]} />
	</div>
	<h3 class="mb-2 text-lg font-bold text-gray-900">{title}</h3>
	<p class="text-sm text-gray-600">{description}</p>
</div>