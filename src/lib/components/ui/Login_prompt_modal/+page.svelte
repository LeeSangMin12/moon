<script>
	import { fade, scale } from 'svelte/transition';
	import { goto } from '$app/navigation';

	import Modal from '../Modal/+page.svelte';

	export let is_modal_open = false;

	const go_to_login = () => {
		goto('/see_more/login');
	};
</script>

<Modal bind:is_modal_open modal_position="center">
	{#if is_modal_open}
		<div in:scale={{ duration: 200, start: 0.95 }} out:fade={{ duration: 150 }}>
			<div
				class="flex flex-col items-center justify-center py-10 font-semibold"
			>
				<p>로그인 후 이용할 수 있습니다.</p>
				<p>로그인페이지로 이동하시겠습니까?</p>
			</div>

			<div class="flex">
				<button
					onclick={() => (is_modal_open = false)}
					class="btn w-1/3 rounded-none"
				>
					닫기
				</button>
				<button
					onclick={go_to_login}
					class="btn btn-primary w-2/3 rounded-none"
				>
					확인
				</button>
			</div>
		</div>
	{/if}
</Modal>
