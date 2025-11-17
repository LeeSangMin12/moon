<script>
	import colors from '$lib/config/colors';
	import { get_user_context } from '$lib/contexts/app_context.svelte.js';
	import { goto, preloadData } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';

	const me = get_user_context();

	onMount(() => {
		console.log(me);
	});

	// Preload data on hover/mouseenter for faster navigation
	const handlePreload = (path) => {
		preloadData(path);
	};
</script>

<nav
	class="btm-nav pb-safe fixed bottom-0 z-10 flex h-[calc(53px+env(safe-area-inset-bottom))] w-full max-w-screen-md items-center justify-evenly bg-white shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]"
>
	<button
		onclick={() => goto('/')}
		onmouseenter={() => handlePreload('/')}
		ontouchstart={() => handlePreload('/')}
		class="flex flex-col items-center gap-0.5"
		aria-label="홈"
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			height="20px"
			viewBox="0 -960 960 960"
			width="20px"
			fill={$page.url.pathname === '/' ? colors.gray[700] : colors.gray[400]}
			><path
				d="M160-200v-360q0-19 8.5-36t23.5-28l240-180q21-16 48-16t48 16l240 180q15 11 23.5 28t8.5 36v360q0 33-23.5 56.5T720-120H600q-17 0-28.5-11.5T560-160v-200q0-17-11.5-28.5T520-400h-80q-17 0-28.5 11.5T400-360v200q0 17-11.5 28.5T360-120H240q-33 0-56.5-23.5T160-200Z"
			/>
		</svg>

		<p
			class={`${$page.url.pathname === '/' ? 'text-gray-800' : 'text-gray-400'} text-[10px]`}
		>
			홈
		</p>
	</button>

	<button
		onclick={() => goto('/community')}
		onmouseenter={() => handlePreload('/community')}
		ontouchstart={() => handlePreload('/community')}
		class="flex flex-col items-center gap-0.5"
		aria-label="커뮤니티"
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			height="20px"
			viewBox="0 -960 960 960"
			width="20px"
			fill={$page.url.pathname === '/community'
				? colors.gray[700]
				: colors.gray[400]}
			><path
				d="M40-240q-17 0-28.5-11.5T0-280v-23q0-43 44-70t116-27q13 0 25 .5t23 2.5q-14 21-21 44t-7 48v65H40Zm240 0q-17 0-28.5-11.5T240-280v-25q0-32 17.5-58.5T307-410q32-20 76.5-30t96.5-10q53 0 97.5 10t76.5 30q32 20 49 46.5t17 58.5v25q0 17-11.5 28.5T680-240H280Zm500 0v-65q0-26-6.5-49T754-397q11-2 22.5-2.5t23.5-.5q72 0 116 26.5t44 70.5v23q0 17-11.5 28.5T920-240H780ZM160-440q-33 0-56.5-23.5T80-520q0-34 23.5-57t56.5-23q34 0 57 23t23 57q0 33-23 56.5T160-440Zm640 0q-33 0-56.5-23.5T720-520q0-34 23.5-57t56.5-23q34 0 57 23t23 57q0 33-23 56.5T800-440Zm-320-40q-50 0-85-35t-35-85q0-51 35-85.5t85-34.5q51 0 85.5 34.5T600-600q0 50-34.5 85T480-480Z"
			/></svg
		>

		<p
			class={`${$page.url.pathname === '/community' ? 'text-gray-800' : 'text-gray-400'} text-[10px]`}
		>
			커뮤니티
		</p>
	</button>

	<button
		onclick={() => goto('/service')}
		onmouseenter={() => handlePreload('/service')}
		ontouchstart={() => handlePreload('/service')}
		class="flex flex-col items-center gap-0.5"
		aria-label="서비스"
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			height="20px"
			viewBox="0 -960 960 960"
			width="20px"
			fill={$page.url.pathname === '/service'
				? colors.gray[700]
				: colors.gray[400]}
			><path
				d="M840-320v-236L518-381q-18 10-38 10t-38-10L104-565q-11-6-15.5-15T84-600q0-11 4.5-20t15.5-15l338-184q9-5 18.5-7.5T480-829q10 0 19.5 2.5T518-819l381 208q10 5 15.5 14.5T920-576v256q0 17-11.5 28.5T880-280q-17 0-28.5-11.5T840-320ZM442-141 242-249q-20-11-31-30t-11-41v-152l242 131q18 10 38 10t38-10l242-131v152q0 22-11 41t-31 30L518-141q-9 5-18.5 7.5T480-131q-10 0-19.5-2.5T442-141Z"
			/></svg
		>

		<p
			class={`${$page.url.pathname === '/service' ? 'text-gray-800' : 'text-gray-400'} text-[10px]`}
		>
			서비스
		</p>
	</button>

	<button
		onclick={() => goto('/outsourcing')}
		onmouseenter={() => handlePreload('/outsourcing')}
		ontouchstart={() => handlePreload('/outsourcing')}
		class="flex flex-col items-center gap-0.5"
		aria-label="외주"
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			height="20px"
			viewBox="0 -960 960 960"
			width="20px"
			fill={$page.url.pathname === '/outsourcing'
				? colors.gray[700]
				: colors.gray[400]}
			><path
				d="M160-120q-33 0-56.5-23.5T80-200v-440q0-33 23.5-56.5T160-720h160v-80q0-33 23.5-56.5T400-880h160q33 0 56.5 23.5T640-800v80h160q33 0 56.5 23.5T880-640v440q0 33-23.5 56.5T800-120H160Zm240-600h160v-80H400v80Z"
			/>
		</svg>

		<p
			class={`${$page.url.pathname === '/outsourcing' ? 'text-gray-800' : 'text-gray-400'} text-[10px]`}
		>
			외주
		</p>
	</button>

	<button
		onclick={() => {
			if (me.handle === '비회원') {
				goto('/login');
			} else {
				goto(`/@${me.handle}`);
			}
		}}
		class="flex flex-col items-center gap-0.5"
		aria-label="프로필"
	>
		<svg
			xmlns="http://www.w3.org/2000/svg"
			height="20px"
			viewBox="0 -960 960 960"
			width="20px"
			fill={$page.url.pathname === `/@${me.handle}`
				? colors.gray[700]
				: colors.gray[400]}
			><path
				d="M234-276q51-39 114-61.5T480-360q69 0 132 22.5T726-276q35-41 54.5-93T800-480q0-133-93.5-226.5T480-800q-133 0-226.5 93.5T160-480q0 59 19.5 111t54.5 93Zm246-164q-59 0-99.5-40.5T340-580q0-59 40.5-99.5T480-720q59 0 99.5 40.5T620-580q0 59-40.5 99.5T480-440Zm0 360q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q83 0 156 31.5T763-763q54 54 85.5 127T880-480q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Z"
			/>
		</svg>

		<p
			class={`${$page.url.pathname === '/profile' ? 'text-gray-800' : 'text-gray-400'} text-[10px]`}
		>
			프로필
		</p>
	</button>
</nav>
