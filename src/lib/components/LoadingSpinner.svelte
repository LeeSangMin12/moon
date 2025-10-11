<script>
	let { isLoading } = $props();
</script>

{#if isLoading}
	<div class="flex justify-center py-4">
		<div
			class="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-gray-900"
		></div>
	</div>
{/if}