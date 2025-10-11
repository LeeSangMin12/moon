<script>
	import { RiAddLine } from 'svelte-remixicon';
	import colors from '$lib/config/colors';
	import { check_login } from '$lib/utils/common';
	import { goto } from '$app/navigation';
	import { get_user_context } from '$lib/contexts/app-context.svelte.js';

	const { me } = get_user_context();
	let { href } = $props();

	const handleClick = () => {
		if (!check_login(me)) return;
		goto(href);
	};
</script>

<div
	class="fixed bottom-18 z-10 mx-auto flex w-full max-w-screen-md justify-end pr-4"
>
	<button
		class="rounded-full bg-blue-500 p-4 text-white shadow-lg hover:bg-blue-600"
		onclick={handleClick}
	>
		<RiAddLine size={20} color={colors.white} />
	</button>
</div>