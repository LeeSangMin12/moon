<script>
	import { onMount } from 'svelte';

	export let images;

	let screen_size;
	let active_index = 0;

	onMount(() => {
		const timer = setInterval(scroll_to_next, 5000);

		return () => clearInterval(timer);
	});

	const get_item_id = (index) => `carousel-item-${index}`;

	const scroll_to_next = () => {
		active_index = (active_index + 1) % images.length;
		const scroll_to_element = document.getElementById(
			get_item_id(active_index),
		);

		if (!scroll_to_element) return;

		const media_query = window.matchMedia('(prefers-reduced-motion: reduce)');
		scroll_to_element.scrollIntoView({
			behavior: media_query.matches ? 'auto' : 'smooth',
			block: 'nearest',
			inline: 'center',
		});
	};
</script>

<svelte:window bind:innerWidth={screen_size} />

{#if screen_size < 480}
	<ul
		class="scrollbar-hide flex w-full snap-x snap-mandatory gap-2 overflow-x-auto"
	>
		{#each images as { title, src, url }, index}
			<a
				href={url}
				id={get_item_id(index)}
				class="relative w-full shrink-0 snap-center px-4"
				target={url.startsWith('http') ? '_blank' : undefined}
			>
				<img
					{title}
					{src}
					alt={title}
					class="h-[100px] w-full rounded-[14px] object-cover drop-shadow-sm"
					loading={index === 0 ? 'eager' : 'lazy'}
					decoding="async"
				/>

				<p
					class="bg-opacity-60 absolute right-6 bottom-2 rounded-2xl bg-black px-3 py-1 text-xs text-white"
				>
					{index + 1}

					<span class="text-gray-700">/ {images.length}</span>
				</p>
			</a>

			<div class=" w-full">
				<div class="h-[100px] w-full bg-red-900"></div>
			</div>
		{/each}
	</ul>
{:else}
	<ul
		class="scrollbar-hide flex snap-x snap-mandatory gap-2 overflow-x-auto before:w-[20vw] before:shrink-0 after:w-[20vw] after:shrink-0"
	>
		{#each images as { title, src, url }, index}
			<a
				href={url}
				id={get_item_id(index)}
				class="shrink-0 snap-center"
				target={url.startsWith('http') ? '_blank' : undefined}
			>
				<img
					{title}
					{src}
					alt={title}
					class="h-[101px] w-80 object-contain drop-shadow-sm"
					loading={index === 0 ? 'eager' : 'lazy'}
					decoding="async"
				/>
			</a>
		{/each}
	</ul>
{/if}

<nav class="hidden">
	<ul>
		{#each images as { title }, index}
			<li class="shrink-0 snap-center">
				<a
					href={`#${get_item_id(index)}`}
					on:click|preventDefault={() => {
						active_index = index;
						scroll_to_next();
					}}>{title}</a
				>
			</li>
		{/each}
	</ul>
</nav>
