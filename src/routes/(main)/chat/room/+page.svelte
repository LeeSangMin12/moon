<script>
	import Header from '$lib/components/ui/Header/+page.svelte';
	import Icon from '$lib/components/ui/Icon/+page.svelte';

	import colors from '$lib/js/colors';

	let message = '';
	let messages = [
		{
			id: 1,
			text: '안녕하세요, SvelteKit에서 라우팅이 제대로 동작하지 않는 문제가 있어요.',
			user: 'me',
			avatar: 'https://randomuser.me/api/portraits/men/33.jpg',
			time: '오전 10:00',
		},
		{
			id: 2,
			text: '안녕하세요! 어떤 상황에서 라우팅이 안 되는지 조금 더 자세히 설명해주실 수 있나요?',
			user: 'dev',
			avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
			time: '오전 10:01',
		},
		{
			id: 3,
			text: '동적 라우트에서 파라미터를 넘길 때, 페이지가 새로고침되면 404가 떠요.',
			user: 'me',
			avatar: 'https://randomuser.me/api/portraits/men/33.jpg',
			time: '오전 10:02',
		},
		{
			id: 4,
			text: '혹시 adapter-static을 사용하고 계신가요? 그 경우, fallback 설정이나 export 옵션을 확인해보셨나요?',
			user: 'dev',
			avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
			time: '오전 10:03',
		},
		{
			id: 5,
			text: '네, adapter-static을 쓰고 있습니다. fallback 설정은 어떻게 하는 건가요?',
			user: 'me',
			avatar: 'https://randomuser.me/api/portraits/men/33.jpg',
			time: '오전 10:04',
		},
		{
			id: 6,
			text: 'svelte.config.js에서 adapter-static의 옵션에 fallback: "index.html"을 추가해보세요. 그리고 export 시 --fallback 옵션도 확인해보시고요.',
			user: 'dev',
			avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
			time: '오전 10:05',
		},
		{
			id: 7,
			text: '감사합니다! 바로 적용해볼게요.',
			user: 'me',
			avatar: 'https://randomuser.me/api/portraits/men/33.jpg',
			time: '오전 10:06',
		},
	];

	function sendMessage() {
		if (message.trim() === '') return;
		messages = [
			...messages,
			{
				id: Date.now(),
				text: message,
				user: 'me',
				avatar: 'https://randomuser.me/api/portraits/men/33.jpg',
				time: new Date().toLocaleTimeString('ko-KR', {
					hour: '2-digit',
					minute: '2-digit',
				}),
			},
		];
		message = '';
		setTimeout(() => {
			const chatArea = document.getElementById('chat-area');
			if (chatArea) chatArea.scrollTop = chatArea.scrollHeight;
		}, 0);
	}
</script>

<Header nav_class="border-b border-gray-200">
	<span slot="left" class="text-lg font-semibold">채팅방</span>
	<span slot="center"></span>
	<span slot="right">
		<Icon attribute="ellipsis" size={24} color={colors.gray[600]} />
	</span>
</Header>

<main class="flex h-[calc(100dvh-56px)] flex-col bg-gray-50">
	<div
		id="chat-area"
		class="scrollbar-hide flex-1 overflow-y-auto px-4 py-4"
		style="scroll-behavior: smooth;"
	>
		{#each messages as msg (msg.id)}
			<div
				class="mb-4 flex py-4 {msg.user === 'me'
					? 'justify-end'
					: 'justify-start'}"
			>
				{#if msg.user !== 'me'}
					<img
						src={msg.avatar}
						alt="avatar"
						class="mr-2 h-8 w-8 self-end rounded-full"
					/>
				{/if}
				<div
					class="flex max-w-[70%] flex-col {msg.user === 'me'
						? 'items-end'
						: 'items-start'}"
				>
					<div
						class="rounded rounded-2xl border border-gray-200 px-4 py-4 text-sm shadow-lg
            {msg.user === 'me'
							? 'bg-primary mr-2 rounded-br-none text-white'
							: 'rounded-bl-none bg-white text-gray-800 '}"
					>
						{msg.text}
					</div>
					<span class="mt-1 text-xs text-gray-400">{msg.time}</span>
				</div>
				{#if msg.user === 'me'}
					<img
						src={msg.avatar}
						alt="avatar"
						class="ml-2 h-8 w-8 self-end rounded-full"
					/>
				{/if}
			</div>
		{/each}
	</div>

	<form
		class="sticky bottom-0 left-0 flex w-full items-center gap-2 border-t border-gray-200 bg-white px-4 py-3"
		on:submit|preventDefault={sendMessage}
		autocomplete="off"
	>
		<input
			class="focus:ring-primary flex-1 rounded-full border border-gray-200 bg-gray-100 px-4 py-2 py-4 text-sm focus:ring-2 focus:outline-none"
			type="text"
			placeholder="메시지를 입력하세요..."
			bind:value={message}
			on:keydown={(e) => e.key === 'Enter' && sendMessage()}
		/>
		<button
			type="submit"
			class="bg-primary rounded-full p-2 transition-colors hover:bg-blue-600"
			aria-label="Send"
		>
			<Icon attribute="send" size={24} color="#fff" rotate={330} />
		</button>
	</form>
</main>
