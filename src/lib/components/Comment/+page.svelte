<script>
	import profile_png from '$lib/img/common/user/profile.png';
	import { createEventDispatcher } from 'svelte';
	import {
		RiArrowDownSLine,
		RiArrowUpSLine,
		RiMore2Fill,
		RiThumbDownFill,
		RiThumbDownLine,
		RiThumbUpFill,
		RiThumbUpLine,
	} from 'svelte-remixicon';

	import GiftModal from '$lib/components/ui/GiftModal/+page.svelte';
	import Icon from '$lib/components/ui/Icon/+page.svelte';

	import colors from '$lib/js/colors';
	import { check_login, get_time_past } from '$lib/js/common';
	import { api_store } from '$lib/store/api_store';
	import { user_store } from '$lib/store/user_store';

	import Self from './+page.svelte';

	const dispatch = createEventDispatcher();

	let { post_id, comment } = $props();

	let reply_content = $state('');
	let is_reply_open = $state(false);
	let are_replies_visible = $state(false);
	let is_gift_modal_open = $state(false);
	let comment_state = $state(comment);

	let textarea_ref = $state(null);

	// comment prop이 변경될 때 local state 업데이트
	$effect(() => {
		comment_state = comment;
	});

	const handle_vote = async (vote) => {
		if (!check_login()) return;

		await $api_store.post_comment_votes.upsert({
			comment_id: comment_state.id,
			user_id: $user_store.id,
			vote,
		});

		if (comment_state.user_vote === vote) {
			comment_state.user_vote = 0;
			if (vote === 1) comment_state.upvotes--;
			else comment_state.downvotes--;
		} else {
			if (vote === 1) {
				if (comment_state.user_vote === -1) comment_state.downvotes--;
				comment_state.upvotes++;
			} else {
				if (comment_state.user_vote === 1) comment_state.upvotes--;
				comment_state.downvotes++;
			}
			comment_state.user_vote = vote;
		}
	};

	const handle_add_reply = async () => {
		const new_reply = await $api_store.post_comments.insert({
			post_id,
			user_id: $user_store.id,
			content: reply_content.trim(),
			parent_comment_id: comment_state.id,
		});

		new_reply.post_comment_votes = [];
		new_reply.upvotes = 0;
		new_reply.downvotes = 0;
		new_reply.user_vote = 0;
		new_reply.replies = [];
		new_reply.users = {
			id: $user_store.id,
			handle: $user_store.handle,
			avatar_url: $user_store.avatar_url,
		};

		// 상위 컴포넌트에 답글 추가 알림
		dispatch('reply_added', {
			parent_comment_id: comment_state.id,
			new_reply,
		});

		reply_content = '';
		is_reply_open = false;
		are_replies_visible = true;
	};

	async function handle_gift_success(event) {
		const { gift_content, gift_moon_point } = event.detail;

		// 상위 컴포넌트에 gift 댓글 추가 알림
		dispatch('gift_comment_added', {
			gift_content,
			gift_moon_point,
			parent_comment_id: comment_state.id,
			post_id,
		});

		is_gift_modal_open = false;
	}

	const handle_reply_added = (event) => {
		// 중첩된 답글 이벤트를 상위로 전달
		dispatch('reply_added', event.detail);
	};

	const handle_gift_comment_added = (event) => {
		// 중첩된 gift 댓글 이벤트를 상위로 전달
		dispatch('gift_comment_added', event.detail);
	};

	const auto_resize = () => {
		if (textarea_ref) {
			textarea_ref.style.height = 'auto';
			textarea_ref.style.height = textarea_ref.scrollHeight + 'px';
		}
	};
</script>

<GiftModal
	bind:is_modal_open={is_gift_modal_open}
	receiver_id={comment_state.users.id}
	receiver_name={comment_state.users.name}
	on:gift_success={handle_gift_success}
/>

<div class="flex flex-col">
	<div class="flex items-start justify-between">
		<div class="flex gap-3">
			<img
				src={comment_state.users.avatar_url ?? profile_png}
				alt="프로필"
				class="h-8 w-8 rounded-full object-cover"
			/>
			<div class="w-full">
				<div class="mb-0.5 flex items-center gap-2">
					<span class="text-sm font-medium text-black"
						>@{comment_state.users.handle}</span
					>
					<span class="text-xs text-gray-400"
						>{get_time_past(new Date(comment_state.created_at))}</span
					>
				</div>

				<div class="text-sm text-gray-800">
					{#if comment_state.gift_moon_point}
						<div
							class="bg-primary mr-2 inline-block flex-col rounded px-2 py-0.5 text-xs text-white"
						>
							<span class="mr-1"> 🌙 </span>

							{comment_state.gift_moon_point}
						</div>
					{/if}
					<p class="mt-1 whitespace-pre-wrap">{comment_state.content}</p>
				</div>

				<div
					class="mt-2 flex items-center justify-between text-sm text-gray-400"
				>
					<div class="flex items-center gap-3 text-xs">
						<button
							class="flex items-center gap-1"
							onclick={() => handle_vote(1)}
						>
							{#if comment_state.user_vote === 1}
								<RiThumbUpFill size={16} color={colors.primary} />
							{:else}
								<RiThumbUpLine size={16} color={colors.gray[400]} />
							{/if}
							<p class:text-primary={comment_state.user_vote === 1}>
								{comment_state.upvotes}
							</p>
						</button>
						<button class="flex items-center" onclick={() => handle_vote(-1)}>
							{#if comment_state.user_vote === -1}
								<RiThumbDownFill size={16} color={colors.warning} />
							{:else}
								<RiThumbDownLine size={16} color={colors.gray[400]} />
							{/if}
						</button>
						{#if comment_state.parent_comment_id === null}
							<button
								class="flex items-center gap-1"
								onclick={() => (is_reply_open = !is_reply_open)}
							>
								<Icon
									attribute="chat_bubble"
									size={16}
									color={colors.gray[400]}
								/>
								<p>답글</p>
							</button>

							<button
								class="flex items-center gap-1"
								onclick={() => (is_gift_modal_open = true)}
							>
								<Icon attribute="gift" size={16} color={colors.gray[400]} />
							</button>
						{/if}
					</div>
				</div>
			</div>
		</div>

		<button>
			<RiMore2Fill size={16} color={colors.gray[500]} />
		</button>
	</div>

	{#if is_reply_open}
		<div class="mt-2 ml-10 flex items-start">
			<textarea
				bind:this={textarea_ref}
				bind:value={reply_content}
				rows="1"
				oninput={auto_resize}
				placeholder="답글을 입력해주세요"
				class="w-full flex-1 resize-none rounded-lg bg-gray-100 p-2 text-sm focus:outline-none"
			></textarea>
			<button
				class="btn btn-sm ml-2 rounded-md bg-blue-500 px-3 py-2 text-xs text-white"
				onclick={handle_add_reply}>등록</button
			>
			<button
				class="btn btn-gray btn-sm ml-2 rounded-md px-3 py-2 text-xs"
				onclick={() => (is_reply_open = false)}>취소</button
			>
		</div>
	{/if}

	{#if comment_state.replies?.length > 0}
		<button
			class="mt-4 ml-10 flex items-center text-xs text-blue-500 hover:underline"
			onclick={() => (are_replies_visible = !are_replies_visible)}
		>
			{#if are_replies_visible}
				<RiArrowUpSLine size={16} color={colors.primary} />
			{:else}
				<RiArrowDownSLine size={16} color={colors.primary} />
			{/if}
			답글 {comment_state.replies.length}개
		</button>

		{#if are_replies_visible}
			<div class="mt-3 ml-10 space-y-3">
				{#each comment_state.replies as reply (reply.id)}
					<Self
						{post_id}
						comment={reply}
						on:reply_added={handle_reply_added}
						on:gift_comment_added={handle_gift_comment_added}
					/>
				{/each}
			</div>
		{/if}
	{/if}
</div>
