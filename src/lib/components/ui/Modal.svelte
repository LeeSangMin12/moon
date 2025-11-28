<script>
	export let is_modal_open;
	export let modal_position;
	export let backdrop_opacity = 'bg-black/50';
	export let disable_backdrop_close = false;
	export let onModalClose;

	const close_modal = () => {
		is_modal_open = false;
		onModalClose?.();
	};
</script>

{#if is_modal_open}
	{#if modal_position === 'center'}
		<div
			class={`scrollbar-hide fixed inset-0 z-50 flex items-center justify-center overflow-auto bg-black px-5 ${backdrop_opacity}`}
		>
			<div
				class="scrollbar-hide relative z-10 max-h-[75vh] w-full max-w-xl overflow-y-auto rounded-lg bg-white"
			>
				<slot />
			</div>
			{#if !disable_backdrop_close}
				<button
					class="absolute inset-0 h-full w-full cursor-default"
					onclick={close_modal}
					aria-label="모달 닫기 배경"
				></button>
			{/if}
		</div>
	{:else if modal_position === 'bottom'}
		<div
			class={`fixed inset-0 z-50 flex justify-center overflow-auto bg-black ${backdrop_opacity}`}
		>
			<div
				class="scrollbar-hide relative z-10 mt-auto max-h-[75vh] w-full max-w-md overflow-y-auto rounded-3xl rounded-b-none bg-white"
			>
				<slot />
			</div>
			{#if !disable_backdrop_close}
				<button
					class="absolute inset-0 h-full w-full cursor-default"
					onclick={close_modal}
					aria-label="모달 닫기 배경"
				></button>
			{/if}
		</div>
	{/if}
{/if}
