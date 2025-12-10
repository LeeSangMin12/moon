<script>
	import { goto } from '$app/navigation';
	import { fade, scale } from 'svelte/transition';

	import Modal from './Modal.svelte';
	import { get_user_context } from '$lib/contexts/app_context.svelte.js';

	export let is_modal_open = false;

	const me = get_user_context();

	const go_to_contact = () => {
		is_modal_open = false;
		goto(`/@${me?.handle}/accounts/contact`);
	};

	const close = () => {
		is_modal_open = false;
	};
</script>

<Modal bind:is_modal_open modal_position="center">
	{#if is_modal_open}
		<div in:scale={{ duration: 200, start: 0.95 }} out:fade={{ duration: 150 }} class="p-4">
			<p class="text-[16px] font-semibold text-gray-900">연락처 등록이 필요합니다.</p>
			<p class="mt-2 text-[14px] text-gray-500">
				외주 진행 시 전문가와 연락을 위해<br />
				연락처 등록이 필요합니다.
			</p>

			<div class="mt-4 flex gap-2">
				<button
					onclick={close}
					class="flex-1 rounded-lg bg-gray-100 py-3 text-[14px] font-medium text-gray-700 active:bg-gray-200"
				>
					나중에
				</button>
				<button
					onclick={go_to_contact}
					class="flex-1 rounded-lg bg-blue-500 py-3 text-[14px] font-medium text-white active:bg-blue-600"
				>
					등록하기
				</button>
			</div>
		</div>
	{/if}
</Modal>
