<script>
	import Icon from '$lib/components/ui/Icon.svelte';

	import colors from '$lib/config/colors';

	let { placeholder, value = $bindable(), onSearch } = $props();
</script>

<div class="bg-white px-4 py-4">
	<div class="relative">
		<input
			type="text"
			{placeholder}
			class="w-full rounded-xl border-0 bg-gray-50 px-4 py-4 text-base font-medium placeholder-gray-400 focus:bg-white focus:ring-gray-200 focus:outline-none"
			bind:value
			onkeydown={async (e) => {
				if (e.key === 'Enter') await onSearch();
			}}
		/>
		<button
			class="absolute top-1/2 right-4 -translate-y-1/2"
			onclick={async () => await onSearch()}
		>
			<Icon attribute="search" size={20} color={colors.gray[400]} />
		</button>
	</div>
</div>
