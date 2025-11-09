<script>
	import { smartGoBack } from '$lib/utils/navigation';
	import { goto } from '$app/navigation';
	import { RiArrowLeftSLine } from 'svelte-remixicon';

	import Header from '$lib/components/ui/Header.svelte';

	import colors from '$lib/config/colors';
	import { show_toast } from '$lib/utils/common';
	import { get_user_context } from '$lib/contexts/app_context.svelte.js';

	const me = get_user_context();

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
	<button slot="left" onclick={smartGoBack}>
		<RiArrowLeftSLine size={26} color={colors.gray[600]} />
	</button>
</Header>

<div class="mt-10 flex flex-col justify-center gap-2">
	<h2 class="text-lg font-bold">계정전환</h2>
	<p class="text-sm text-gray-500">현재 계정: {me.name}</p>

	<button
		onclick={() => sign_in('dummy6@naver.com', '1234')}
		class="btn btn-primary"
		>문
	</button>

	<button
		onclick={() => sign_in('dummy4@naver.com', '1234')}
		class="btn btn-primary"
		>매일 Ai 뉴스봇
	</button>

	<button
		onclick={() => sign_in('dummy7@naver.com', '1234')}
		class="btn btn-primary"
		>김윤지
	</button>

	<button
		onclick={() => sign_in('dummy8@naver.com', '1234')}
		class="btn btn-primary"
		>박서윤
	</button>

	<button
		onclick={() => sign_in('dummy9@naver.com', '1234')}
		class="btn btn-primary"
		>김도현
	</button>

	<button
		onclick={() => sign_in('dummy10@naver.com', '1234')}
		class="btn btn-primary"
		>이준호
	</button>

	<button
		onclick={() => sign_in('dummy5@naver.com', '1234')}
		class="btn btn-primary"
		>데이터먹는쩡은
	</button>

	<button
		onclick={() => sign_in('dummy2@naver.com', '1234')}
		class="btn btn-primary"
		>디자인 크리에이터 유민
	</button>

	<button
		onclick={() => sign_in('dummy3@naver.com', '1234')}
		class="btn btn-primary"
		>모던랩 스튜디오 - Plan · Design · Code
	</button>

	<button
		onclick={() => sign_in('dummy1@naver.com', '1234')}
		class="btn btn-primary"
		>mvpick
	</button>
</div>
