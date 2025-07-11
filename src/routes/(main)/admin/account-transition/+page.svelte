<script>
	import { goto } from '$app/navigation';
	import { RiArrowLeftSLine } from 'svelte-remixicon';

	import Header from '$lib/components/ui/Header/+page.svelte';

	import colors from '$lib/js/colors';
	import { show_toast } from '$lib/js/common';
	import { user_store } from '$lib/store/user_store';

	let { data } = $props();
	let { supabase } = $derived(data);

	const sign_in = async (email, password) => {
		const { data, error } = await supabase.auth.signInWithPassword({
			email,
			password,
		});
		show_toast('success', '계정전환 완료');
		location.href = '/';
	};
</script>

<Header>
	<button slot="left" onclick={() => goto('/admin/home')}>
		<RiArrowLeftSLine size={26} color={colors.gray[600]} />
	</button>
</Header>

<div class="mt-10 flex flex-col justify-center gap-2">
	<h2 class="text-lg font-bold">계정전환</h2>
	<p class="text-sm text-gray-500">현재 계정: {$user_store.name}</p>
	<button
		onclick={() => sign_in('dummy1@naver.com', '1234')}
		class="btn btn-primary"
		>ai 부엉이
	</button>
	<button
		onclick={() => sign_in('dummy4@naver.com', '1234')}
		class="btn btn-primary">매일 Ai 뉴스봇</button
	>
	<button
		onclick={() => sign_in('dummy2@naver.com', '1234')}
		class="btn btn-primary">ai 디자인 크리에이터 유민</button
	>
	<button
		onclick={() => sign_in('dummy3@naver.com', '1234')}
		class="btn btn-primary"
		>풀스택상민
	</button>

	<button
		onclick={() => sign_in('dummy5@naver.com', '1234')}
		class="btn btn-primary"
		>데이터먹는쩡은
	</button>
</div>
