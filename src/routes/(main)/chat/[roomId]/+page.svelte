<script>
	import { goto } from '$app/navigation';
	import { RiArrowLeftSLine, RiRemixiconFill } from 'svelte-remixicon';
	import { smartGoBack } from '$lib/utils/navigation';

	import Header from '$lib/components/ui/Header/+page.svelte';
	import Icon from '$lib/components/ui/Icon/+page.svelte';
	import Modal from '$lib/components/ui/Modal/+page.svelte';

	import colors from '$lib/js/colors';

	const TITLE = '채팅방';

	let is_menu_modal_open = false;
	// const roomId = $page.params.roomId;
</script>

<Header>
	<div slot="left">
		<button class="flex items-center" onclick={smartGoBack}>
			<RiArrowLeftSLine size={28} color={colors.gray[600]} />
		</button>
	</div>
	<h1 slot="center" class="text-medium">이상민</h1>
	<div slot="right">
		<button class="flex items-center">
			<Icon attribute="menu" size={24} color={colors.gray[600]} />
		</button>
	</div>
</Header>

<main class="px-4">
	<div class="my-2 text-center text-xs text-gray-500">
		2025년 6월 11일 수요일
	</div>

	<div class="chat chat-start">
		<div class="chat-image avatar">
			<div class="w-10 rounded-full">
				<img
					alt="Tailwind CSS chat bubble component"
					src="https://img.daisyui.com/images/profile/demo/kenobee@192.webp"
				/>
			</div>
		</div>
		<div class="chat-header"></div>
		<div class="chat-bubble text-sm">개발 외주 필요하신거 맞으신가요?</div>
		<time class="chat-footer mt-0.5 text-xs text-gray-500">12:45</time>
	</div>
	<div class="chat chat-end">
		<div class="chat-bubble roundedl-full bg-secondary text-sm">
			냅 맞습니다
		</div>
		<time class="chat-footer mt-0.5 text-xs text-gray-500">12:46</time>
	</div>

	<div class="chat chat-end">
		<div class="chat-bubble roundedl-full bg-secondary text-sm">
			혹시 견적은 얼마 정도 나올까요?
		</div>
		<time class="chat-footer mt-0.5 text-xs text-gray-500">12:46</time>
	</div>
</main>

<Modal bind:is_modal_open={is_menu_modal_open} modal_position="bottom">
	<div class="flex flex-col items-center bg-gray-100 p-4 text-sm font-medium">
		<div class=" flex w-full flex-col items-center rounded-lg bg-white">
			<div class="flex w-full items-center gap-2 p-3">
				<p class="text-red-500">채팅방 나가기</p>
			</div>
		</div>
	</div>
</Modal>
