<script>
	import { goto } from '$app/navigation';
	import { RiArrowLeftSLine, RiRemixiconFill } from 'svelte-remixicon';
	import { smart_go_back } from '$lib/utils/navigation';

	import Header from '$lib/components/ui/Header.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';

	import colors from '$lib/config/colors';

	const TITLE = '채팅방';

	let is_menu_modal_open = false;
	// const roomId = $page.params.roomId;
</script>

<Header>
	<div slot="left">
		<button class="flex items-center" onclick={smart_go_back}>
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
					alt="상대방 프로필 사진"
					src="https://img.daisyui.com/images/profile/demo/kenobee@192.webp"
					loading="lazy"
					width="40"
					height="40"
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
	<div class="pb-6">
		<!-- 드래그 핸들 -->
		<div class="flex justify-center py-3">
			<div class="h-1 w-10 rounded-full bg-gray-300"></div>
		</div>

		<div>
			<button
				class="flex w-full items-center gap-3 px-4 py-4 active:bg-gray-50"
				aria-label="채팅방 나가기"
			>
				<Icon attribute="exit" size={20} color="#ef4444" />
				<span class="text-[15px] text-red-500">채팅방 나가기</span>
			</button>
		</div>
	</div>
</Modal>
