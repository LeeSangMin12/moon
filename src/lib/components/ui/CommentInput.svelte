<script>
	import { RiArrowUpLine } from 'svelte-remixicon';

	let { placeholder = '댓글을 입력해주세요', onLeaveComment } = $props();

	let content = $state('');
	let textarea_ref;

	const leave_comment = () => {
		onLeaveComment?.({ content });
		content = '';
	};

	const auto_resize = () => {
		if (textarea_ref) {
			textarea_ref.style.height = 'auto';
			textarea_ref.style.height = textarea_ref.scrollHeight + 'px';
		}
	};
</script>

<div
	class="fixed bottom-0 flex w-full max-w-screen-md items-center bg-white pb-[env(safe-area-inset-bottom)] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]"
>
	<textarea
		bind:this={textarea_ref}
		bind:value={content}
		rows="1"
		{placeholder}
		class="my-2 mr-3 ml-4 block flex-1 rounded-lg bg-gray-100 p-2 text-sm transition-all focus:outline-none"
		oninput={auto_resize}
		style="overflow-y: hidden;"
	></textarea>

	<button
		class="bg-primary mr-4 mb-3 flex h-8 w-8 items-center justify-center self-end rounded-full"
		onclick={leave_comment}
	>
		<RiArrowUpLine size={20} color="white" />
	</button>
</div>
