<script>
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { RiArrowLeftSLine, RiTimeLine, RiMailLine, RiCupLine } from 'svelte-remixicon';

	import Header from '$lib/components/ui/Header.svelte';
	import TabSelector from '$lib/components/ui/TabSelector.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';

	import colors from '$lib/config/colors';
	import { get_user_context, get_api_context } from '$lib/contexts/app_context.svelte.js';
	import { show_toast } from '$lib/utils/common';
	import { optimize_avatar } from '$lib/utils/image';

	const me = get_user_context();
	const api = get_api_context();

	let { data } = $props();

	const tabs = ['받은 커피챗', '보낸 커피챗'];
	let selected_tab = $state(0);
	let received_chats = $state(data.received_chats || []);
	let sent_chats = $state(data.sent_chats || []);

	onMount(async () => {
		// 서버에서 이미 데이터를 받았으므로 추가 로딩은 필요시에만
		if (received_chats.length === 0 && sent_chats.length === 0) {
			await loadCoffeeChats();
		}
	});

	const loadCoffeeChats = async () => {
		try {
			if (me?.id) {
				const [received, sent] = await Promise.all([
					api.coffee_chats.select_received(me.id),
					api.coffee_chats.select_sent(me.id)
				]);
				received_chats = received;
				sent_chats = sent;
			}
		} catch (error) {
			console.error('Error loading coffee chats:', error);
			show_toast('error', '커피챗을 불러오는데 실패했습니다.');
		}
	};

	const getStatusText = (status) => {
		const statusMap = {
			pending: '대기중',
			accepted: '수락됨',
			rejected: '거절됨'
		};
		return statusMap[status] || status;
	};

	const getStatusColor = (status) => {
		const colorMap = {
			pending: 'text-yellow-600 bg-yellow-100',
			accepted: 'text-green-600 bg-green-100',
			rejected: 'text-red-600 bg-red-100'
		};
		return colorMap[status] || 'text-gray-600 bg-gray-100';
	};

	const formatDate = (dateString) => {
		return new Date(dateString).toLocaleDateString('ko-KR', {
			year: 'numeric',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	};

	const goToProfile = (handle) => {
		goto(`/@${handle}`);
	};
</script>

<svelte:head>
	<title>커피챗 | 문</title>
	<meta
		name="description"
		content="받은 커피챗과 보낸 커피챗을 확인하고 관리할 수 있습니다."
	/>
</svelte:head>

<Header>
	<div slot="left">
		<button class="flex items-center" onclick={() => goto(`/@${me?.handle}/accounts`)}>
			<RiArrowLeftSLine size={24} color={colors.gray[600]} />
		</button>
	</div>
	<h1 slot="center" class="font-semibold">커피챗</h1>
</Header>

<main>
	<div class="px-4 py-4">
		<TabSelector {tabs} bind:selected={selected_tab} />
	</div>

	{#if selected_tab === 0}
		<!-- 받은 커피챗 -->
		<div class="px-4 pb-20">
			{#if received_chats.length === 0}
				<div class="flex flex-col items-center justify-center py-16 text-center">
					<div class="mb-4 rounded-full bg-gray-100 p-4">
						<RiCupLine size={48} color={colors.gray[400]} />
					</div>
					<h3 class="mb-2 text-lg font-semibold text-gray-900">
						아직 받은 커피챗이 없어요
					</h3>
					<p class="text-sm text-gray-500">
						다른 사용자가 커피챗을 요청하면 여기에 표시됩니다.
					</p>
				</div>
			{:else}
				<div class="space-y-4">
					{#each received_chats as chat}
						<div class="rounded-xl border border-gray-200 bg-white p-5">
							<!-- 헤더: 보낸 사람 정보와 상태 -->
							<div class="mb-4 flex items-center justify-between">
								<button 
									class="flex items-center space-x-3"
									onclick={() => goToProfile(chat.sender.handle)}
								>
									<img
										src={optimize_avatar(chat.sender.avatar_url)}
										alt={chat.sender.name}
										class="h-10 w-10 rounded-full object-cover"
										loading="lazy"
										width="40"
										height="40"
									/>
									<div class="text-left">
										<p class="font-medium text-gray-900">{chat.sender.name}</p>
										<p class="text-sm text-gray-500">@{chat.sender.handle}</p>
									</div>
								</button>
								<span class={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(chat.status)}`}>
									{getStatusText(chat.status)}
								</span>
							</div>

							<!-- 커피챗 내용 -->
							<div class="mb-4">
								<h3 class="mb-2 font-semibold text-gray-900">{chat.subject}</h3>
								<p class="text-sm leading-relaxed text-gray-600">{chat.content}</p>
							</div>

							<!-- 이메일 정보 -->
							<div class="mb-4 flex items-center space-x-2 rounded-lg bg-gray-50 p-3">
								<RiMailLine size={16} color={colors.gray[500]} />
								<span class="text-sm text-gray-600">{chat.email}</span>
							</div>

							<!-- 하단: 날짜와 액션 버튼 -->
							<div class="flex items-center justify-between">
								<div class="flex items-center space-x-2 text-xs text-gray-500">
									<RiTimeLine size={14} />
									<span>{formatDate(chat.created_at)}</span>
								</div>
								
								{#if chat.status === 'pending'}
									<div class="flex space-x-2">
										<button
											class="rounded-lg bg-green-500 px-4 py-2 text-sm font-medium text-white hover:bg-green-600"
											onclick={async () => {
												try {
													await api.coffee_chats.update_status(chat.id, 'accepted');

													// 수락 알림 생성
													try {
														await api.notifications.insert({
															recipient_id: chat.sender.id,
															actor_id: me.id,
															type: 'coffee_chat.accepted',
															resource_type: 'coffee_chat',
															resource_id: String(chat.id),
															payload: {
																recipient_id: me.id,
																recipient_name: me.name,
																recipient_handle: me.handle,
																subject: chat.subject
															},
															link_url: `/@${me.handle}/accounts/coffee-chat`
														});
													} catch (notificationError) {
														console.error('Failed to create acceptance notification:', notificationError);
													}

													await loadCoffeeChats();
													show_toast('success', '커피챗 요청을 수락했습니다.');
												} catch (error) {
													show_toast('error', '오류가 발생했습니다.');
												}
											}}
										>
											수락
										</button>
										<button
											class="rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
											onclick={async () => {
												try {
													await api.coffee_chats.update_status(chat.id, 'rejected');

													// 거절 알림 생성
													try {
														await api.notifications.insert({
															recipient_id: chat.sender.id,
															actor_id: me.id,
															type: 'coffee_chat.rejected',
															resource_type: 'coffee_chat',
															resource_id: String(chat.id),
															payload: {
																recipient_id: me.id,
																recipient_name: me.name,
																recipient_handle: me.handle,
																subject: chat.subject
															},
															link_url: `/@${me.handle}/accounts/coffee-chat`
														});
													} catch (notificationError) {
														console.error('Failed to create rejection notification:', notificationError);
													}

													await loadCoffeeChats();
													show_toast('success', '커피챗 요청을 거절했습니다.');
												} catch (error) {
													show_toast('error', '오류가 발생했습니다.');
												}
											}}
										>
											거절
										</button>
									</div>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{:else}
		<!-- 보낸 커피챗 -->
		<div class="px-4 pb-20">
			{#if sent_chats.length === 0}
				<div class="flex flex-col items-center justify-center py-16 text-center">
					<div class="mb-4 rounded-full bg-gray-100 p-4">
						<RiCupLine size={48} color={colors.gray[400]} />
					</div>
					<h3 class="mb-2 text-lg font-semibold text-gray-900">
						아직 보낸 커피챗이 없어요
					</h3>
					<p class="text-sm text-gray-500">
						다른 사용자에게 커피챗을 요청해보세요!
					</p>
				</div>
			{:else}
				<div class="space-y-4">
					{#each sent_chats as chat}
						<div class="rounded-xl border border-gray-200 bg-white p-5">
							<!-- 헤더: 받는 사람 정보와 상태 -->
							<div class="mb-4 flex items-center justify-between">
								<button 
									class="flex items-center space-x-3"
									onclick={() => goToProfile(chat.recipient.handle)}
								>
									<img
										src={optimize_avatar(chat.recipient.avatar_url)}
										alt={chat.recipient.name}
										class="h-10 w-10 rounded-full object-cover"
										loading="lazy"
										width="40"
										height="40"
									/>
									<div class="text-left">
										<p class="font-medium text-gray-900">{chat.recipient.name}</p>
										<p class="text-sm text-gray-500">@{chat.recipient.handle}</p>
									</div>
								</button>
								<span class={`rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(chat.status)}`}>
									{getStatusText(chat.status)}
								</span>
							</div>

							<!-- 커피챗 내용 -->
							<div class="mb-4">
								<h3 class="mb-2 font-semibold text-gray-900">{chat.subject}</h3>
								<p class="text-sm leading-relaxed text-gray-600">{chat.content}</p>
							</div>

							<!-- 이메일 정보 -->
							<div class="mb-4 flex items-center space-x-2 rounded-lg bg-gray-50 p-3">
								<RiMailLine size={16} color={colors.gray[500]} />
								<span class="text-sm text-gray-600">{chat.email}</span>
							</div>

							<!-- 하단: 날짜 -->
							<div class="flex items-center space-x-2 text-xs text-gray-500">
								<RiTimeLine size={14} />
								<span>{formatDate(chat.created_at)}</span>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</main>