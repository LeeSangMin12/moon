<script>
	let { selected_topics, topic_categories } = $props();

	const is_selected = (topic) => {
		return selected_topics.some((t) => t.id === topic.id);
	};

	const toggle_topic = (topic) => {
		const index = selected_topics.findIndex((t) => t.id === topic.id);

		if (index > -1) {
			selected_topics.splice(index, 1);
		} else if (selected_topics.length < 3) {
			selected_topics.push(topic);
		}
	};
</script>

<section class="mx-4">
	<div class="mt-10 text-xl font-semibold">
		<p>커뮤니티 주제를 알려주세요</p>
	</div>

	<div class="mt-6">
		<p class="text-sm">
			커뮤니티 주제 {selected_topics.length}/3
		</p>
	</div>

	<!-- 선택된 토픽 -->
	<div class="mt-2 flex flex-wrap gap-2">
		{#each selected_topics as topic}
			<div class="flex items-center rounded-full bg-gray-200 px-3 py-1 text-sm">
				{topic.name}
				<button class="ml-2 text-gray-500" onclick={() => toggle_topic(topic)}
					>✕</button
				>
			</div>
		{/each}
	</div>
</section>

<section class="mx-4 mt-6 space-y-6">
	<!-- 카테고리별 토픽들 -->
	{#each topic_categories as category}
		<div>
			<p class="mb-2 font-semibold">{category.emoji} {category.name}</p>
			<div class="flex flex-wrap gap-2">
				{#each category.topics as topic}
					<button
						class="rounded-full px-3 py-1 text-sm transition
              {is_selected(topic)
							? 'bg-gray-800 text-white'
							: 'bg-gray-100 hover:bg-gray-200'}"
						onclick={() => toggle_topic(topic)}
					>
						{topic.name}
					</button>
				{/each}
			</div>
		</div>
	{/each}
</section>
