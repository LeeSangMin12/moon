<script>
	import { PUBLIC_WEB_CLIENT_URL } from '$env/static/public';
	import logo from '$lib/img/logo.png';
	import kakao_login from '$lib/img/partials/login/kakao_login.png';
	import landing_logo from '$lib/img/partials/login/landing_logo.jpg';

	import Header from '$lib/components/ui/Header/+page.svelte';

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
</script>

<Header nav_class="bg-white"></Header>

<main class="flex h-screen flex-col items-center justify-between">
	<div class="mt-26 flex flex-col items-center">
		<h1 class="text-primary text-2xl font-semibold">질문할땐? 문!</h1>

		<img
			src={landing_logo}
			alt="landing_logo_png"
			class="mt-6 h-80 w-full object-cover px-4"
		/>
	</div>

	<button onclick={sign_in_with_kakao}>
		<img
			id="kakao_login_for_ga4"
			class="h-12 w-80"
			src={kakao_login}
			alt="카카오 로그인 버튼"
		/>
	</button>
</main>
