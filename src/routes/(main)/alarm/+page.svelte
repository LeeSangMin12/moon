<script>
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { smart_go_back } from '$lib/utils/navigation';
	import { RiArrowLeftSLine } from 'svelte-remixicon';

	import Bottom_nav from '$lib/components/ui/Bottom_nav.svelte';
	import Header from '$lib/components/ui/Header.svelte';

	import colors from '$lib/config/colors';
	import { get_user_context, get_api_context } from '$lib/contexts/app_context.svelte.js';

	const me = get_user_context();
	const api = get_api_context();

	let { data } = $props();
	let { notifications } = $state(data);

	const format_datetime = (value) =>
		new Date(value).toLocaleString('ko-KR', {
			year: 'numeric',
			month: 'numeric',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit',
		});

	const open_notification = async (n) => {
		if (!n.read_at) {
			await api.notifications.mark_as_read(n.id, me.id);
			n.read_at = new Date().toISOString();
		}
		if (n.link_url) goto(n.link_url);
	};

	onMount(async () => {
		try {
			if (me?.id) {
				await api.notifications.mark_all_as_read(me.id);
				// 로컬 상태도 즉시 반영
				const now = new Date().toISOString();
				notifications = notifications.map((n) => ({
					...n,
					read_at: n.read_at ?? now,
				}));
			}
		} catch (e) {
			console.error('Failed to mark all notifications as read:', e);
		}
	});
</script>

<svelte:head>
	<title>알림 | 문</title>
</svelte:head>

<Header>
	<button slot="left" onclick={smart_go_back}>
		<RiArrowLeftSLine size={24} color={colors.gray[600]} />
	</button>
	<h1 slot="center" class="font-semibold">알림</h1>
</Header>

<main class="px-4">
	{#if notifications.length === 0}
		<div class="py-24 text-center text-gray-500">새 알림이 없어요.</div>
	{:else}
		<ul class="divide-y divide-gray-100">
			{#each notifications as n}
				<li class={`py-3`}>
					<button
						type="button"
						class="w-full text-left"
						onclick={() => open_notification(n)}
					>
						<div class="flex items-start justify-between gap-2">
							<div class="flex flex-1 flex-col gap-1 min-w-0">
								{#if n.type === 'post.liked'}
									<p class="text-sm">
										<strong
											>{n.actor?.name ||
												'@' + (n.actor?.handle || '익명')}</strong
										>님이 게시글을 좋아했습니다.
									</p>
									<p class="mt-1 text-sm text-gray-600 break-words">
										{n.payload?.post_title}
									</p>
								{:else if n.type === 'service.liked'}
									<p class="text-sm">
										<strong
											>{n.actor?.name ||
												'@' + (n.actor?.handle || '익명')}</strong
										>님이 서비스를 좋아했습니다.
									</p>
									<p class="mt-1 text-sm text-gray-600 break-words">
										{n.payload?.service_title}
									</p>
								{:else if n.type === 'comment.created'}
									<p class="text-sm">
										<strong
											>{n.actor?.name ||
												'@' + (n.actor?.handle || '익명')}</strong
										>님이 댓글을 남겼습니다.
									</p>
									<p class="mt-1 text-sm text-gray-600 break-words">
										{n.payload?.preview}
									</p>
								{:else if n.type === 'comment.reply'}
									<p class="text-sm">
										<strong
											>{n.actor?.name ||
												'@' + (n.actor?.handle || '익명')}</strong
										>님이 답글을 남겼습니다.
									</p>
									<p class="mt-1 text-sm text-gray-600 break-words">
										{n.payload?.preview}
									</p>
								{:else if n.type === 'follow.created'}
									<p class="text-sm">
										<strong
											>{n.actor?.name ||
												'@' + (n.actor?.handle || '익명')}</strong
										>님이 회원님을 팔로우했습니다.
									</p>
								{:else if n.type === 'order.created'}
									<p class="text-sm">새 주문이 접수되었습니다.</p>
									<p class="mt-1 text-sm text-gray-600 break-words">
										{n.payload?.service_title}
									</p>
								{:else if n.type === 'order.approved'}
									<p class="text-sm">주문이 결제 승인되었습니다.</p>
									<p class="mt-1 text-sm text-gray-600 break-words">
										{n.payload?.service_title}
									</p>
								{:else if n.type === 'order.completed'}
									<p class="text-sm">서비스가 완료되었습니다.</p>
									<p class="mt-1 text-sm text-gray-600 break-words">
										{n.payload?.service_title}
									</p>
								{:else if n.type === 'order.cancelled'}
									<p class="text-sm">주문이 취소되었습니다.</p>
									<p class="mt-1 text-sm text-gray-600 break-words">
										{n.payload?.service_title}
									</p>
								{:else if n.type === 'review.created'}
									<p class="text-sm">
										<strong
											>{n.actor?.name ||
												'@' + (n.actor?.handle || '익명')}</strong
										>님이 리뷰를 작성했습니다.
									</p>
									<p class="mt-1 text-sm text-gray-600 break-words">
										{n.payload?.title}
									</p>
								{:else if n.type === 'expert_review.created'}
									<p class="text-sm">
										<strong
											>{n.actor?.name ||
												'@' + (n.actor?.handle || '익명')}</strong
										>님이 전문가 요청 리뷰를 작성했습니다.
									</p>
									<p class="mt-1 text-sm text-gray-600 break-words">
										{n.payload?.request_title}
									</p>
									<div class="mt-1 flex items-center gap-1">
										{#each Array(5) as _, i}
											<svg
												class="h-3 w-3 {i < (n.payload?.rating || 0)
													? 'text-yellow-400'
													: 'text-gray-300'}"
												fill="currentColor"
												viewBox="0 0 20 20"
											>
												<path
													d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
												/>
											</svg>
										{/each}
									</div>
								{:else if n.type === 'proposal.accepted'}
									<p class="text-sm">
										<strong
											>{n.actor?.name ||
												'@' + (n.actor?.handle || '익명')}</strong
										>님이 회원님의 제안을 수락했습니다!
									</p>
									<p class="mt-1 text-sm text-gray-600 break-words">
										{n.payload?.request_title}
									</p>
								{:else if n.type === 'gift.received'}
									<p class="text-sm">
										선물을 받았습니다. (+{n.payload?.amount} 문)
									</p>
								{:else if n.type === 'coffee_chat.requested'}
									<p class="text-sm">
										<strong
											>{n.actor?.name ||
												'@' + (n.actor?.handle || '익명')}</strong
										>님이 커피챗을 요청했습니다.
									</p>
									<p class="mt-1 text-sm text-gray-600 break-words">
										{n.payload?.subject}
									</p>
								{:else if n.type === 'coffee_chat.accepted'}
									<p class="text-sm">
										<strong
											>{n.actor?.name ||
												'@' + (n.actor?.handle || '익명')}</strong
										>님이 커피챗 요청을 수락했습니다.
									</p>
									<p class="mt-1 text-sm text-gray-600 break-words">
										{n.payload?.subject}
									</p>
								{:else if n.type === 'coffee_chat.rejected'}
									<p class="text-sm">
										<strong
											>{n.actor?.name ||
												'@' + (n.actor?.handle || '익명')}</strong
										>님이 커피챗 요청을 거절했습니다.
									</p>
									<p class="mt-1 text-sm text-gray-600 break-words">
										{n.payload?.subject}
									</p>
								{:else if n.type === 'proposal_received'}
									<p class="text-sm">새로운 제안이 접수되었습니다.</p>
									<p class="mt-1 text-sm text-gray-600 break-words">
										{n.payload?.title}
									</p>
								{:else if n.type === 'proposal_accepted'}
									<p class="text-sm">제안이 수락되었습니다!</p>
									<p class="mt-1 text-sm text-gray-600 break-words">
										{n.payload?.title}
									</p>
								{:else if n.type === 'project_completed'}
									<p class="text-sm">프로젝트가 완료되었습니다.</p>
									<p class="mt-1 text-sm text-gray-600 break-words">
										{n.payload?.title}
										{#if n.payload?.payout}
											<span class="text-blue-600">(+{n.payload.payout.toLocaleString()}원)</span>
										{/if}
									</p>
								{:else if n.type === 'service_order_completed'}
									<p class="text-sm">서비스 판매가 완료되었습니다.</p>
									<p class="mt-1 text-sm text-gray-600 break-words">
										{n.payload?.title}
										{#if n.payload?.payout}
											<span class="text-blue-600">(+{n.payload.payout.toLocaleString()}원)</span>
										{/if}
									</p>
								{:else}
									<p class="text-sm font-medium">{n.type}</p>
								{/if}
							</div>
							<div class="shrink-0 text-xs text-gray-500 whitespace-nowrap self-start">
								{format_datetime(n.created_at)}
							</div>
						</div>
					</button>
				</li>
			{/each}
		</ul>
	{/if}
</main>
