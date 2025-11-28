<script>
	import colors from '$lib/config/colors';
	import { get_user_context } from '$lib/contexts/app_context.svelte.js';
	import { check_login } from '$lib/utils/common';
	import { fade, scale } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import { RiAddLine, RiCloseLine } from 'svelte-remixicon';

	const me = get_user_context();

	/**
	 * @typedef {Object} Action
	 * @property {string} label - 버튼 텍스트
	 * @property {string} href - 이동할 경로
	 * @property {boolean} [external] - 외부 URL 여부
	 */

	/** @type {{ href?: string, actions?: Action[] }} */
	let { href, actions } = $props();

	let is_menu_open = $state(false);

	const handle_click = () => {
		if (!check_login(me)) return;

		if (actions && actions.length > 0) {
			is_menu_open = !is_menu_open;
		} else if (href) {
			goto(href);
		}
	};

	/**
	 * @param {Action} action
	 */
	const handle_action_click = (action) => {
		is_menu_open = false;
		if (action.external) {
			window.open(action.href, '_blank');
		} else {
			goto(action.href);
		}
	};

	const close_menu = () => {
		is_menu_open = false;
	};
</script>

{#if is_menu_open}
	<!-- Backdrop -->
	<button
		class="fixed inset-0 z-[60] bg-black/30"
		onclick={close_menu}
		aria-label="메뉴 닫기"
		transition:fade={{ duration: 150 }}
	></button>
{/if}

<div
	class="pointer-events-none fixed bottom-18 z-[70] mx-auto flex w-full max-w-screen-md justify-end pr-4"
>
	<div class="relative flex flex-col items-end gap-3">
		<!-- Action Menu -->
		{#if is_menu_open && actions}
			<div
				class="flex flex-col gap-2"
				transition:scale={{ duration: 150, start: 0.9 }}
			>
				{#each actions as action (action.href)}
					<button
						class="pointer-events-auto rounded-full bg-white px-4 py-3 text-sm font-medium whitespace-nowrap text-gray-800 shadow-lg hover:bg-gray-50"
						onclick={() => handle_action_click(action)}
					>
						{action.label}
					</button>
				{/each}
			</div>
		{/if}

		<!-- FAB Button -->
		<button
			class="pointer-events-auto rounded-full bg-blue-500 p-4 text-white shadow-lg transition-transform hover:bg-blue-600"
			class:rotate-45={is_menu_open}
			onclick={handle_click}
		>
			{#if is_menu_open}
				<RiCloseLine size={20} color={colors.white} />
			{:else}
				<RiAddLine size={20} color={colors.white} />
			{/if}
		</button>
	</div>
</div>
