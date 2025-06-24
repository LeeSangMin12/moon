<script>
	import { createEventDispatcher } from 'svelte';
	import { RiArrowUpLine } from 'svelte-remixicon';

	let { placeholder = '댓글을 입력해주세요' } = $props();

	const dispatch = createEventDispatcher();

	let content = $state('');
	let textareaEl;

	function handleSubmit() {
		if (content.trim()) {
			dispatch('submit', { content });
			content = '';
			autoResize();
		}
	}

	function autoResize() {
		if (textareaEl) {
			textareaEl.style.height = 'auto';
			textareaEl.style.height = textareaEl.scrollHeight + 'px';
		}
	}
</script>

<div
	class="fixed bottom-0 flex w-full max-w-screen-md items-center bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]"
>
	<textarea
		bind:this={textareaEl}
		bind:value={content}
		rows="1"
		{placeholder}
		class="my-2 mr-3 ml-4 block flex-1 resize-none rounded-lg bg-gray-100 p-2 text-sm transition-all focus:outline-none"
		oninput={autoResize}
		style="overflow-y: hidden;"
	></textarea>

	<button
		class="bg-primary mr-4 mb-3 flex h-8 w-8 items-center justify-center self-end rounded-full"
		onclick={handleSubmit}
	>
		<RiArrowUpLine size={20} color="white" />
	</button>
</div>
