<script>
	import { RiAddLine } from 'svelte-remixicon';
	import colors from '$lib/js/colors';
	import { check_login } from '$lib/js/common';
	import { goto } from '$app/navigation';

	let { href } = $props();

	const handleClick = () => {
		if (!check_login()) return;
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