<script>
	import { goto } from '$app/navigation';
	import { RiArrowLeftSLine } from 'svelte-remixicon';
	import { smartGoBack } from '$lib/utils/navigation';

	import Header from '$lib/components/ui/Header.svelte';

	import colors from '$lib/config/colors';
	import { show_toast } from '$lib/utils/common';

	let { data } = $props();
	let { supabase } = $derived(data);

	let login_data = $state({
		email: '',
		password: '',
	});

	const login = async (email, password) => {
		const { data, error } = await supabase.auth.signInWithPassword({
			email,
			password,
		});

		if (error) {
			show_toast('error', error.message);
			return;
		}

		show_toast('success', '계정전환 완료');
		location.href = '/admin/home';
	};
</script>

<svelte:head>
	<title>관리자 로그인 | 문</title>
	<meta
		name="description"
		content="문 플랫폼 관리자 페이지입니다. 관리자 계정으로 로그인하여 플랫폼을 관리하세요."
	/>
</svelte:head>

<Header>
	<button slot="left" onclick={smartGoBack}>
		<RiArrowLeftSLine size={26} color={colors.gray[600]} />
	</button>
</Header>
<div class="mx-4 mt-8">
	<p class="ml-1 font-semibold">Email</p>

	<div class="mt-2">
		<input
			type="tel"
			placeholder="email"
			bind:value={login_data.email}
			class="input input-bordered focus:border-primary h-[52px] w-full focus:outline-none"
		/>
	</div>
</div>

<div class="mx-4 mt-8">
	<p class="ml-1 font-semibold">Password</p>

	<div class="mt-2">
		<input
			type="text"
			bind:value={login_data.password}
			class="input input-bordered focus:border-primary h-[52px] w-full focus:outline-none"
		/>
	</div>
</div>

<div class="fixed bottom-0 w-full max-w-screen-md bg-white p-4">
	<div class="pb-safe">
		<button
			onclick={() => login(login_data.email, login_data.password)}
			class="btn btn-primary w-full"
			>로그인
		</button>
	</div>
</div>
