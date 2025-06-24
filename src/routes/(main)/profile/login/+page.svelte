<!-- <script>
	import { PUBLIC_WEB_CLIENT_URL } from '$env/static/public';
	import { onMount } from 'svelte';

	let { data } = $props();
	let { supabase, session } = $state(data);

	onMount(async () => {
		console.log('data', data);
	});

	const signInWithKakao = async () => {
		const { data, error } = await supabase.auth.signInWithOAuth({
			provider: 'kakao',
			options: {
				redirectTo: `${PUBLIC_WEB_CLIENT_URL}/auth/callback`,
			},
		});
	};

	const signOut = async () => {
		const { error } = await supabase.auth.signOut();
	};
</script>

<button class="btn btn-primary" onclick={signInWithKakao}
	>Sign in with Kakao</button
>
<button class="btn btn-primary" onclick={signOut}>Sign out</button> -->
