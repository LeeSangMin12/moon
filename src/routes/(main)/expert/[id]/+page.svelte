<script>
	import profile_png from '$lib/img/common/user/profile.png';
	import { goto } from '$app/navigation';
	import {
		RiArrowLeftSLine,
		RiCloseLine,
		RiHeartLine,
		RiShareLine,
	} from 'svelte-remixicon';

	import CustomCarousel from '$lib/components/ui/Carousel/+page.svelte';
	import Header from '$lib/components/ui/Header/+page.svelte';
	import Icon from '$lib/components/ui/Icon/+page.svelte';
	import Modal from '$lib/components/ui/Modal/+page.svelte';

	import colors from '$lib/js/colors';
	import { comma } from '$lib/js/common';

	let { data } = $props();
	let { service } = $derived(data);

	const TITLE = '전문가';

	const images = [
		'https://img.daisyui.com/images/stock/photo-1625726411847-8cbb60cc71e6.webp',
		'https://img.daisyui.com/images/stock/photo-1625726411847-8cbb60cc71e6.webp',
		'https://blog.kakaocdn.net/dn/yLSQp/btsplMvT4kv/gkbSO89MwORwlkaAT5qLSk/img.jpg',
		'https://img.daisyui.com/images/stock/photo-1625726411847-8cbb60cc71e6.webp',
		'https://img.daisyui.com/images/stock/photo-1625726411847-8cbb60cc71e6.webp',
		'https://img.daisyui.com/images/stock/photo-1625726411847-8cbb60cc71e6.webp',
		'https://img.daisyui.com/images/stock/photo-1625726411847-8cbb60cc71e6.webp',
		'https://img.daisyui.com/images/stock/photo-1625726411847-8cbb60cc71e6.webp',
		'https://img.daisyui.com/images/stock/photo-1625726411847-8cbb60cc71e6.webp',
		'https://rukminim3.flixcart.com/image/850/1000/kwgpz0w0/paper/0/k/q/black-1-coloured-paper-sharma-business-original-imag94z6y4smhcz7.jpeg?q=20&crop=false',
	];

	let is_buy_modal_open = $state(false);

	let explanation = '';
</script>

<Header>
	<button slot="left" onclick={() => goto('/expert')}>
		<RiArrowLeftSLine size={24} color={colors.gray[600]} />
	</button>
	<h1 slot="center" class="font-semibold">{service.title}</h1>
</Header>

<main>
	<figure>
		<CustomCarousel images={service.images.map((image) => image.uri)} />
	</figure>

	<div class="mx-4 mt-6">
		<div class="flex items-center">
			<img
				src={service.users.avatar_url || profile_png}
				alt={service.users.name}
				class="mr-2 h-8 w-8 rounded-full"
			/>
			<p class="pr-4 text-sm font-medium">{service.users.name}</p>
		</div>

		<div class="mt-2">
			<h1 class="text-lg font-semibold">{service.title}</h1>
		</div>

		<div class=" flex items-center">
			<div class="flex items-center text-yellow-500">
				<Icon attribute="star" size={16} color={colors.primary} />
			</div>

			<span class="text-sm font-medium">{service.rating}</span>
			<span class="ml-1 text-sm text-gray-500">({service.rating_count})</span>
		</div>

		<p class="text-primary mt-6 text-xl font-bold">
			₩{comma(service.price)}
		</p>

		<div class="mt-4">
			<div class="min-h-[184px] w-full rounded-[7px] bg-gray-50 px-5 py-4">
				<div class="text-sm whitespace-pre-wrap">
					{service.description}
				</div>
			</div>
		</div>
	</div>

	<div class="fixed bottom-0 w-full max-w-screen-md bg-white px-5 py-3.5">
		<div class="pb-safe flex space-x-2">
			<button
				class="btn btn-primary flex h-9 flex-1 items-center justify-center"
				onclick={() => (is_buy_modal_open = true)}
			>
				구매하기
			</button>
			<button
				class="btn flex h-9 flex-1 items-center justify-center border-none bg-gray-100"
			>
				문의하기
			</button>
			<button
				class="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100"
			>
				<RiHeartLine />
			</button>
		</div>
	</div>
</main>

<Modal bind:is_modal_open={is_buy_modal_open} modal_position="center">
	<div class="p-4">
		<div class="flex justify-between">
			<h3 class="font-semibold">{service.title}구매하기</h3>
			<button onclick={() => (is_buy_modal_open = false)}>
				<RiCloseLine size={24} color={colors.gray[400]} />
			</button>
		</div>

		<div class="mt-6">
			<p class="text-sm font-medium">입금자명</p>
			<input
				type="text"
				class="mt-2 w-full rounded-sm bg-gray-100 p-2 text-sm transition-all focus:outline-none"
			/>
		</div>

		<div class="mt-4">
			<p class="text-sm font-medium">은행</p>
			<input
				type="text"
				class="mt-2 w-full rounded-sm bg-gray-100 p-2 text-sm transition-all focus:outline-none"
			/>
		</div>

		<div class="mt-4">
			<p class="text-sm font-medium">계좌번호</p>
			<input
				type="text"
				class="mt-2 w-full rounded-sm bg-gray-100 p-2 text-sm transition-all focus:outline-none"
			/>
		</div>

		<div class="my-4 h-px bg-gray-200"></div>

		<div>
			<div class="flex justify-between">
				<p class="font-semibold">총 결제 금액</p>
				<p class="text-primary text-lg font-bold">
					₩{comma(service.price)}
				</p>
			</div>
		</div>

		<div
			class="font-semibod mt-2 flex flex-col justify-center bg-gray-50 px-4 py-2 text-sm text-gray-900"
		>
			<p>
				아직은 계좌이체만 지원되고 있어요!<br />
				더 편리한 결제를 위해 다양한 수단을 준비 중이니 조금만 기다려주세요 😊
			</p>
		</div>

		<button class="btn btn-primary mt-4 w-full rounded-lg">결제하기</button>
	</div>
</Modal>
