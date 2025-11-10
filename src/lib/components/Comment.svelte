<script>
	import profile_png from '$lib/img/common/user/profile.png';
	import {
		RiArrowDownSLine,
		RiArrowUpSLine,
		RiCloseLine,
		RiDeleteBinLine,
		RiMore2Fill,
		RiPencilLine,
		RiThumbDownFill,
		RiThumbDownLine,
		RiThumbUpFill,
		RiThumbUpLine,
	} from 'svelte-remixicon';

	import GiftModal from '$lib/components/ui/GiftModal.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';

	import colors from '$lib/config/colors';
	import { check_login, get_time_past, show_toast } from '$lib/utils/common';
	import { get_user_context, get_api_context } from '$lib/contexts/app_context.svelte.js';

	import Self from './Comment.svelte';

	const me = get_user_context();
	const api = get_api_context();

	let {
		post_id,
		comment,
		onReplyAdded,
		onGiftCommentAdded,
		onCommentDeleted,
		onVoteChanged
	} = $props();

	let reply_content = $state('');
	let is_reply_open = $state(false);
	let are_replies_visible = $state(false);
	let is_gift_modal_open = $state(false);

	// 로컬 변경사항만 추적 (optimistic UI update)
	let local_votes = $state({
		user_vote: null,
		upvotes: null,
		downvotes: null
	});

	// 로컬 수정 상태
	let local_edit = $state({
		content: null,
		updated_at: null
	});

	// 수정 관련 상태
	let is_editing = $state(false);
	let edit_content = $state('');
	let is_more_modal_open = $state(false);

	let textarea_ref = $state(null);
	let edit_textarea_ref = $state(null);

	const handle_vote = async (vote) => {
		if (!check_login(me)) return;

		const current_vote = local_votes.user_vote ?? comment.user_vote;
		const current_upvotes = local_votes.upvotes ?? comment.upvotes;
		const current_downvotes = local_votes.downvotes ?? comment.downvotes;

		// Optimistic update
		if (current_vote === vote) {
			// 투표 취소: DB에서 레코드 삭제
			await api.post_comment_votes.delete(comment.id, me.id);
			local_votes.user_vote = 0;
			if (vote === 1) local_votes.upvotes = current_upvotes - 1;
			else local_votes.downvotes = current_downvotes - 1;
		} else {
			// 투표 추가 또는 변경
			await api.post_comment_votes.upsert({
				comment_id: comment.id,
				user_id: me.id,
				vote,
			});
			local_votes.user_vote = vote;
			if (vote === 1) {
				local_votes.upvotes = current_upvotes + 1;
				if (current_vote === -1) local_votes.downvotes = current_downvotes - 1;
			} else {
				local_votes.downvotes = current_downvotes + 1;
				if (current_vote === 1) local_votes.upvotes = current_upvotes - 1;
			}
		}

		// 부모 컴포넌트에 알림
		onVoteChanged?.({
			comment_id: comment.id,
			user_vote: local_votes.user_vote,
			upvotes: local_votes.upvotes,
			downvotes: local_votes.downvotes
		});
	};

	const handle_add_reply = async () => {
		const new_reply = await api.post_comments.insert({
			post_id,
			user_id: me.id,
			content: reply_content.trim(),
			parent_comment_id: comment.id,
		});

		new_reply.post_comment_votes = [];
		new_reply.upvotes = 0;
		new_reply.downvotes = 0;
		new_reply.user_vote = 0;
		new_reply.replies = [];
		new_reply.users = {
			id: me.id,
			handle: me.handle,
			avatar_url: me.avatar_url,
		};

		// 상위 컴포넌트에 답글 추가 알림
		onReplyAdded?.({
			parent_comment_id: comment.id,
			new_reply,
		});

		reply_content = '';
		is_reply_open = false;
		are_replies_visible = true;
	};

	const handle_edit_comment = () => {
		edit_content = local_edit.content ?? comment.content;
		is_editing = true;
		is_more_modal_open = false;

		// 다음 tick에 포커스 설정
		setTimeout(() => {
			if (edit_textarea_ref) {
				edit_textarea_ref.focus();
				auto_resize_edit();
			}
		}, 0);
	};

	const handle_save_edit = async () => {
		if (!edit_content.trim()) {
			show_toast('error', '댓글 내용을 입력해주세요.');
			return;
		}

		try {
			const updated_comment = await api.post_comments.update(
				comment.id,
				me.id,
				edit_content.trim(),
			);

			// Optimistic update
			local_edit.content = updated_comment.content;
			local_edit.updated_at = updated_comment.updated_at;
			is_editing = false;
			show_toast('success', '댓글이 수정되었습니다.');
		} catch (error) {
			console.error('댓글 수정 실패:', error);
			show_toast('error', '댓글 수정에 실패했습니다.');
		}
	};

	const handle_cancel_edit = () => {
		edit_content = '';
		is_editing = false;
	};

	const handle_delete_comment = async () => {
		if (!confirm('정말 삭제하시겠습니까?')) return;

		try {
			await api.post_comments.delete(comment.id, me.id);

			// 상위 컴포넌트에 삭제 알림
			onCommentDeleted?.({
				comment_id: comment.id,
				parent_comment_id: comment.parent_comment_id,
			});

			show_toast('success', '댓글이 삭제되었습니다.');
		} catch (error) {
			console.error('댓글 삭제 실패:', error);
			show_toast('error', '댓글 삭제에 실패했습니다.');
		}
	};

	async function handle_gift_success({ gift_content, gift_moon_point, post_id: modal_post_id }) {
		// 상위 컴포넌트에 gift 댓글 추가 알림
		onGiftCommentAdded?.({
			gift_content,
			gift_moon_point,
			parent_comment_id: comment.id,
			post_id,
		});

		is_gift_modal_open = false;
	}

	const handle_reply_added = (data) => {
		// 중첩된 답글 이벤트를 상위로 전달
		onReplyAdded?.(data);
	};

	const handle_gift_comment_added = (data) => {
		// 중첩된 gift 댓글 이벤트를 상위로 전달
		onGiftCommentAdded?.(data);
	};

	const handle_comment_deleted = (data) => {
		// 중첩된 댓글 삭제 이벤트를 상위로 전달
		onCommentDeleted?.(data);
	};

	const handle_vote_changed = (data) => {
		// 중첩된 vote 이벤트를 상위로 전달
		onVoteChanged?.(data);
	};

	const auto_resize = () => {
		if (textarea_ref) {
			textarea_ref.style.height = 'auto';
			textarea_ref.style.height = textarea_ref.scrollHeight + 'px';
		}
	};

	const auto_resize_edit = () => {
		if (edit_textarea_ref) {
			edit_textarea_ref.style.height = 'auto';
			edit_textarea_ref.style.height = edit_textarea_ref.scrollHeight + 'px';
		}
	};

	// 작성자인지 확인하는 computed property
	const is_author = $derived(comment.users?.id === me.id);
</script>

<GiftModal
	bind:is_modal_open={is_gift_modal_open}
	receiver_id={comment.users.id}
	receiver_name={comment.users.name}
	onGiftSuccess={handle_gift_success}
/>

<!-- 더보기 모달 -->
<Modal bind:is_modal_open={is_more_modal_open} modal_position="bottom">
	<div class="flex flex-col items-center bg-gray-100 p-4 text-sm font-medium">
		{#if is_author}
			<div class="flex w-full flex-col items-center rounded-lg bg-white">
				<button
					class="flex w-full items-center gap-3 p-3"
					onclick={handle_edit_comment}
					aria-label="댓글 수정하기"
				>
					<RiPencilLine size={20} color={colors.gray[600]} />
					<p class="text-gray-600">수정하기</p>
				</button>

				<hr class="w-full border-gray-100" />

				<button
					class="flex w-full items-center gap-3 p-3"
					onclick={handle_delete_comment}
					aria-label="댓글 삭제하기"
				>
					<RiDeleteBinLine size={20} color={colors.warning} />
					<p class="text-red-500">삭제하기</p>
				</button>
			</div>
		{:else}
			<div class="flex w-full flex-col items-center rounded-lg bg-white">
				<button
					class="flex w-full items-center gap-3 p-3"
					onclick={() => {
						// 신고 기능은 나중에 구현
						show_toast('info', '신고 기능은 준비 중입니다.');
						is_more_modal_open = false;
					}}
					aria-label="댓글 신고하기"
				>
					<Icon attribute="exclamation" size={20} color={colors.warning} />
					<p class="text-gray-600">신고하기</p>
				</button>
			</div>
		{/if}
	</div>
</Modal>

<div class="flex flex-col">
	<div class="flex w-full items-start justify-between">
		<div class="flex gap-3">
			<a class="h-8 w-8 flex-shrink-0" href={comment.users?.handle ? `/@${comment.users.handle}` : '#'}>
				<img
					src={comment.users?.avatar_url ?? profile_png}
					alt="프로필"
					class="block aspect-square h-full w-full rounded-full object-cover"
					loading="lazy"
				/>
			</a>
			<div class="w-full">
				<div class="mb-0.5 flex items-center gap-2">
					<a
						class="text-sm font-medium text-black"
						href={comment.users?.handle ? `/@${comment.users.handle}` : '#'}
						>@{comment.users?.handle ?? '알 수 없음'}</a
					>
					<span class="text-xs text-gray-400"
						>{get_time_past(new Date(comment.created_at))}</span
					>
					{#if (local_edit.updated_at ?? comment.updated_at) && (local_edit.updated_at ?? comment.updated_at) !== comment.created_at}
						<span class="text-xs text-gray-400">(수정됨)</span>
					{/if}
				</div>

				<div class="text-sm text-gray-800">
					{#if comment.gift_moon_point}
						<div
							class="bg-primary mr-2 inline-block flex-col rounded px-2 py-0.5 text-xs text-white"
						>
							<span class="mr-1"> 🌙 </span>
							{comment.gift_moon_point}
						</div>
					{/if}

					{#if is_editing}
						<div class="mt-1 flex items-start">
							<textarea
								bind:this={edit_textarea_ref}
								bind:value={edit_content}
								rows="1"
								oninput={auto_resize_edit}
								placeholder="댓글을 입력해주세요"
								class="w-full flex-1 resize-none rounded-lg bg-gray-100 p-2 text-sm focus:outline-none"
							></textarea>
							<button
								class="btn btn-sm ml-2 rounded-md bg-blue-500 px-3 py-2 text-xs text-white"
								onclick={handle_save_edit}>저장</button
							>
							<button
								class="btn btn-gray btn-sm ml-2 rounded-md px-3 py-2 text-xs"
								onclick={handle_cancel_edit}>취소</button
							>
						</div>
					{:else}
						<p class="mt-1 whitespace-pre-wrap">{local_edit.content ?? comment.content}</p>
					{/if}
				</div>

				{#if !is_editing}
					<div
						class="mt-2 flex items-center justify-between text-sm text-gray-400"
					>
						<div class="flex items-center gap-3 text-xs">
							<button
								class="flex items-center gap-1"
								onclick={() => handle_vote(1)}
								aria-label="좋아요"
							>
								{#if (local_votes.user_vote ?? comment.user_vote) === 1}
									<RiThumbUpFill size={16} color={colors.primary} />
								{:else}
									<RiThumbUpLine size={16} color={colors.gray[400]} />
								{/if}
								<p class:text-primary={(local_votes.user_vote ?? comment.user_vote) === 1}>
									{local_votes.upvotes ?? comment.upvotes}
								</p>
							</button>
							<button class="flex items-center" onclick={() => handle_vote(-1)} aria-label="싫어요">
								{#if (local_votes.user_vote ?? comment.user_vote) === -1}
									<RiThumbDownFill size={16} color={colors.warning} />
								{:else}
									<RiThumbDownLine size={16} color={colors.gray[400]} />
								{/if}
							</button>
							<!-- {#if comment.parent_comment_id === null} -->
							<button
								class="flex items-center gap-1"
								onclick={() => (is_reply_open = !is_reply_open)}
								aria-label="답글 작성"
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
								aria-label="선물하기"
							>
								<Icon attribute="gift" size={16} color={colors.gray[400]} />
							</button>
							<!-- {/if} -->
						</div>
					</div>
				{/if}
			</div>
		</div>

		{#if !is_editing}
			<button onclick={() => (is_more_modal_open = true)} aria-label="댓글 메뉴 열기">
				<RiMore2Fill size={16} color={colors.gray[500]} />
			</button>
		{/if}
	</div>

	{#if is_reply_open && !is_editing}
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

	{#if comment.replies?.length > 0}
		<button
			class="mt-4 ml-10 flex items-center text-xs text-blue-500 hover:underline"
			onclick={() => (are_replies_visible = !are_replies_visible)}
			aria-label={are_replies_visible ? `답글 ${comment.replies.length}개 숨기기` : `답글 ${comment.replies.length}개 보기`}
		>
			{#if are_replies_visible}
				<RiArrowUpSLine size={16} color={colors.primary} />
			{:else}
				<RiArrowDownSLine size={16} color={colors.primary} />
			{/if}
			답글 {comment.replies.length}개
		</button>

		{#if are_replies_visible}
			<div class="mt-3 ml-10 space-y-3">
				{#each comment.replies as reply (reply.id)}
					<Self
						{post_id}
						comment={reply}
						onReplyAdded={handle_reply_added}
						onGiftCommentAdded={handle_gift_comment_added}
						onCommentDeleted={handle_comment_deleted}
						onVoteChanged={handle_vote_changed}
					/>
				{/each}
			</div>
		{/if}
	{/if}
</div>
