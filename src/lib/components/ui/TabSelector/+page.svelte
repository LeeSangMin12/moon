<script>
	export let tabs = [];
	export let selected = 0;
	export let on_change = () => {};

	const handle_change = (i) => {
		selected = i;
		on_change();
	};
</script>

<div
	class="flex overflow-x-auto overflow-y-hidden border-b-[1px] border-gray-400 font-semibold"
>
	{#each tabs as tab, i}
		<button
			class="relative flex-shrink-0 px-8 pb-2 text-center text-sm transition-colors duration-200
        {selected === i ? 'text-black' : 'text-gray-400'}"
			onclick={() => handle_change(i)}
			type="button"
		>
			{tab}
			{#if selected === i}
				<span
					class="absolute bottom-[-1px] left-1/2 block h-[2px] w-4/6 -translate-x-1/2 bg-black"
				></span>
			{/if}
		</button>
	{/each}
</div>
