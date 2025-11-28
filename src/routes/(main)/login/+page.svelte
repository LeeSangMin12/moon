<script>
	import { PUBLIC_WEB_CLIENT_URL } from '$env/static/public';
	import logo from '$lib/img/logo.png';
	import kakao_login from '$lib/img/partials/login/kakao_login.png';
	import { smart_go_back } from '$lib/utils/navigation';
	import { goto } from '$app/navigation';
	import { RiArrowLeftSLine } from 'svelte-remixicon';

	import Header from '$lib/components/ui/Header.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';

	import colors from '$lib/config/colors';
	import { show_toast } from '$lib/utils/common';

	let is_corporation_login = $state(false);
	let corporation_login_id = $state('');
	let corporation_login_pw = $state('');

	const TITLE = '문';

	let { data } = $props();

	let { supabase, session } = $state(data);

	const sign_in_with_kakao = async () => {
		const { data, error } = await supabase.auth.signInWithOAuth({
			provider: 'kakao',
			options: {
				redirectTo: `${PUBLIC_WEB_CLIENT_URL}/auth/callback`,
			},
		});
	};

	const corporation_login = async () => {
		const { data, error } = await supabase.auth.signInWithPassword({
			email: corporation_login_id,
			password: corporation_login_pw,
		});

		if (error) {
			show_toast('error', error.message);
			return;
		}

		show_toast('success', '로그인 완료');
		location.href = '/';
	};
</script>

<svelte:head>
	<title>로그인 | 문 - 질문할땐? 문!</title>
	<meta
		name="description"
		content="문에 로그인하고 전문가들과 소통하세요. 지식 공유, 후원, 서비스 판매, 채용 연계까지 모든 것을 문에서 경험하세요."
	/>
</svelte:head>

<Header>
	<button slot="left" onclick={smart_go_back}>
		<RiArrowLeftSLine size={28} color={colors.gray[800]} />
	</button>
</Header>

<main class="flex h-screen flex-col items-center justify-between">
	<div class="mt-26 flex flex-col items-center">
		<h1 class="text-primary text-2xl font-semibold">질문할땐? 문!</h1>

		<enhanced:img
			src="$lib/img/partials/login/landing_logo.jpg"
			alt="landing_logo_png"
			class="mt-6 h-80 w-full object-cover px-4"
		/>

		<h2 class="text-center text-gray-500">지식 공유 하면</h2>
		<h2 class="text-center text-gray-500">후원, 서비스 판매, 채용 연계까지!</h2>
	</div>

	<div class="flex flex-col items-center justify-center gap-3">
		<button onclick={sign_in_with_kakao}>
			<img
				id="kakao_login_for_ga4"
				class="h-12 w-80"
				src={kakao_login}
				alt="카카오 로그인 버튼"
			/>
		</button>

		<button
			class="btn btn-gray h-12 w-80"
			onclick={() => (is_corporation_login = true)}>기업 로그인</button
		>
	</div>
</main>

<Modal bind:is_modal_open={is_corporation_login} modal_position="bottom">
	<div class="flex flex-col items-center p-4">
		<div class=" h-1 w-10 self-center bg-gray-300" />

		<h3 class="mt-6 text-lg font-bold">기업 로그인</h3>

		<div class="flex w-full flex-col">
			<div class="mx-5 mt-4">
				<p class="ml-1">id</p>

				<div class="mt-2.5">
					<input
						type="text"
						bind:value={corporation_login_id}
						class="input input-bordered focus:border-primary h-[52px] w-full focus:outline-none"
					/>
				</div>
			</div>

			<div class="mx-5 mt-4">
				<p class="ml-1">비밀번호</p>

				<div class="mt-2.5">
					<input
						type="password"
						bind:value={corporation_login_pw}
						class="input input-bordered focus:border-primary h-[52px] w-full focus:outline-none"
					/>
				</div>
			</div>

			<div class="pb-safe mx-5 mt-10">
				<button class="btn btn-primary w-full" onclick={corporation_login}
					>로그인</button
				>
			</div>
		</div>
	</div>
</Modal>
