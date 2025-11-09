<script>
	import { RiArrowLeftSLine, RiArrowRightSLine } from 'svelte-remixicon';

	import Header from '$lib/components/ui/Header.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';

	import colors from '$lib/config/colors';
	import { get_user_context } from '$lib/contexts/app_context.svelte.js';

	const me = get_user_context();

	const TITLE = '회원 정보 설정';

	let { data } = $props();
	let { supabase } = $derived(data);

	let logout_modal = $state(false);

	const logout = async () => {
		const { error } = await supabase.auth.signOut();
		location.href = '/';
	};
</script>

<svelte:head>
	<title>회원 정보 설정 | 문</title>
	<meta name="description" content="회원 정보 설정 페이지입니다." />
</svelte:head>

<Header>
	<div slot="left">
		<a class="flex items-center" href={`/@${me?.handle}/accounts`}>
			<RiArrowLeftSLine size={24} color={colors.gray[800]} />
		</a>
	</div>
	<h1 slot="center" class="font-semibold">{TITLE}</h1>
</Header>

<main>
	<div class="mx-5 mt-5 flex flex-col gap-[30px]">
		<a
			href={`/@${me?.handle}/accounts/profile/modify`}
			class="flex items-center justify-between"
		>
			<span>프로필 정보 수정</span>
			<svg
				width="7"
				height="13"
				viewBox="0 0 7 13"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					d="M0.998535 11.1914L5.99853 6.19141L0.998535 1.19141"
					stroke="#909090"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
		</a>
		<button
			class="flex items-center justify-between"
			onclick={() => (logout_modal = true)}
		>
			<span>로그아웃</span>
			<svg
				width="7"
				height="13"
				viewBox="0 0 7 13"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					d="M0.998535 11.1914L5.99853 6.19141L0.998535 1.19141"
					stroke="#909090"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				/>
			</svg>
		</button>
	</div>
</main>

<Modal bind:is_modal_open={logout_modal} modal_position="center">
	<div class="p-5">
		<h3 class=" font-semibold">로그아웃 하시겠어요?</h3>

		<div class="mt-8 flex justify-end gap-3">
			<button onclick={() => (logout_modal = false)} class="btn btn-sm"
				>닫기</button
			>
			<button onclick={logout} class="btn btn-error btn-sm text-white"
				>로그아웃</button
			>
		</div>
	</div>
</Modal>
