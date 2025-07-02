<script>
	import { RiStarFill, RiStarLine } from 'svelte-remixicon';

	import colors from '$lib/js/colors';

	let {
		rating = $bindable(0),
		readonly = false,
		size = 20,
		show_rating_text = false,
		on_change = () => {},
	} = $props();

	let hover_rating = $state(0);

	const handle_click = (star) => {
		if (readonly) return;
		rating = star;
		on_change(star);
	};

	const handle_hover = (star) => {
		if (readonly) return;
		hover_rating = star;
	};

	const handle_leave = () => {
		if (readonly) return;
		hover_rating = 0;
	};

	const get_star_color = (star) => {
		if (readonly) {
			return star <= rating ? colors.primary : colors.gray[300];
		}
		const current_rating = hover_rating || rating;
		return star <= current_rating ? colors.primary : colors.gray[300];
	};

	const get_rating_text = (rating) => {
		const rating_texts = {
			1: '매우 불만족',
			2: '불만족',
			3: '보통',
			4: '만족',
			5: '매우 만족',
		};
		return rating_texts[rating] || '';
	};
</script>

<div class="flex items-center gap-1">
	<div class="flex items-center {readonly ? '' : 'cursor-pointer'}">
		{#each [1, 2, 3, 4, 5] as star}
			<button
				type="button"
				disabled={readonly}
				onclick={() => handle_click(star)}
				onmouseenter={() => handle_hover(star)}
				onmouseleave={handle_leave}
				class="p-0.5 transition-transform {readonly
					? 'cursor-default'
					: 'hover:scale-110'}"
			>
				{#if star <= (hover_rating || rating)}
					<RiStarFill {size} color={get_star_color(star)} />
				{:else}
					<RiStarLine {size} color={get_star_color(star)} />
				{/if}
			</button>
		{/each}
	</div>

	{#if show_rating_text && (hover_rating || rating)}
		<span class="ml-2 text-sm text-gray-600">
			{get_rating_text(hover_rating || rating)}
		</span>
	{/if}

	{#if readonly && rating > 0}
		<span class="ml-1 text-sm text-gray-600">
			({rating.toFixed(1)})
		</span>
	{/if}
</div>
