<script>
	export let lines = 3;
	export let className = '';
</script>

<div class="animate-pulse {className}">
	{#each Array(lines) as _, i}
		<div class="mb-2 h-4 rounded bg-gray-200"></div>
	{/each}
</div>
