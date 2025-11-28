<script>
	import colors from '$lib/config/colors';
	import { get_user_context } from '$lib/contexts/app_context.svelte.js';
	import { smart_go_back } from '$lib/utils/navigation.js';
	import { RiArrowLeftSLine } from 'svelte-remixicon';

	import Header from '$lib/components/ui/Header.svelte';

	const TITLE = '회사소개';
	const me = get_user_context();
</script>

<svelte:head>
	<title>{TITLE} | 문</title>
	<meta name="description" content={TITLE} />
</svelte:head>

<Header>
	<button slot="left" class="flex items-center" onclick={smart_go_back}>
		<RiArrowLeftSLine size={24} color={colors.gray[600]} />
	</button>
	<h1 slot="center" class="font-semibold">{TITLE}</h1>
</Header>

<main>
	<div class="mx-6 mt-6 flex flex-col items-center">
		<div>
			<p class="text-[13px] text-[#767676]">퓨처밴스</p>
			<p class="mt-1.5 text-[13px] text-[#767676]">대표 : 이상민</p>
			<p class="mt-1.5 text-[13px] text-[#767676]">
				부산 수영구 수영로 642번길 28 2층 1호
			</p>
			<p class="mt-1.5 text-[13px] text-[#767676]">
				사업자등록번호 : 507-06-34662
			</p>
			<p class="mt-1.5 text-[13px] text-[#767676]">
				개인정보보호책임자 : 이상민
			</p>

			<p class="mt-1.5 text-[13px] text-[#767676]">
				이메일: devsangmin32@gmail.com
			</p>
			<p class="mt-8 text-lg font-semibold text-[#111111]">070-8018-6194</p>

			<!-- <p class="mt-8 text-lg font-semibold text-[#111111]">070-8098-4659</p> -->

			<!-- <div class="mt-[30px] flex pb-8">
				<a href="https://apps.apple.com/app/id6608968892">
					<enhanced:img
						src="@/lib/img/common/app_store/app_store.png"
						alt="app_store"
						class="mr-2 h-11 w-[120px]"
					/>
				</a>

				<a
					href="https://play.google.com/store/apps/details?id=io.dabitiz.surveymoa"
				>
					<enhanced:img
						src="@/lib/img/common/app_store/play_store.png"
						alt="play_store"
						class="h-11 w-[120px]"
					/>
				</a>
			</div> -->
		</div>
	</div>
</main>
