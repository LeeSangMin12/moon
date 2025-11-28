<script>
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { smart_go_back } from '$lib/utils/navigation';
	import {
		RiArrowDownSLine,
		RiArrowLeftSLine,
		RiArrowRightSLine,
		RiArrowUpLine,
		RiArrowUpSLine,
		RiBookmarkFill,
		RiBookmarkLine,
		RiMore2Fill,
		RiPencilLine,
		RiUserFollowLine,
		RiUserUnfollowLine,
	} from 'svelte-remixicon';

	import CustomCarousel from '$lib/components/ui/Carousel.svelte';
	import CommentInput from '$lib/components/ui/CommentInput.svelte';
	import Header from '$lib/components/ui/Header.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Comment from '$lib/components/Comment.svelte';
	import Post from '$lib/components/Post.svelte';

	import colors from '$lib/config/colors';
	import { check_login, copy_to_clipboard, show_toast } from '$lib/utils/common';
	import { get_user_context, get_api_context } from '$lib/contexts/app_context.svelte.js';
	import { create_post_handlers } from '$lib/composables/use_post_handlers.svelte.js';

	const me = get_user_context();
	const api = get_api_context();

	const TITLE = '게시글';

	const REPORT_REASONS = [
		'스팸/광고성 콘텐츠입니다.',
		'욕설/혐오 발언을 사용했습니다.',
		'선정적인 내용을 포함하고 있습니다.',
		'잘못된 정보를 포함하고 있습니다.',
		'기타',
	];

	let { data } = $props();
	let { post, comments, page_url } = $state(data);

	// State: Bookmark (derived from post.post_bookmarks - single source of truth)
	let is_bookmarked = $derived(
		me?.id && post.post_bookmarks
			? post.post_bookmarks.some((bookmark) => bookmark.user_id === me.id)
			: false,
	);
	let is_bookmarking = $state(false);

	// State: Follow
	let is_following = $state(false);

	let modal = $state({
		post_config: false,
		report: false,
	});

	let post_report_form_data = $state({
		reason: '',
		details: '',
	});

	onMount(async () => {
		if (me?.id) {
			is_following = await api.user_follows.is_following(
				me.id,
				post.users.id,
			);
		}
	});

	const leave_post_comment = async ({ content }) => {
		const new_comment = await api.post_comments.insert({
			post_id: post.id,
			user_id: me.id,
			content: content.trim(),
		});

		new_comment.post_comment_votes = [];
		new_comment.upvotes = 0;
		new_comment.downvotes = 0;
		new_comment.user_vote = 0;
		new_comment.replies = [];
		new_comment.users = {
			id: me.id,
			handle: me.handle,
			avatar_url: me.avatar_url,
		};

		comments = [...comments, new_comment];

		// 앱 레벨 알림 생성: 게시글 작성자에게 (자기 자신 제외)
		try {
			if (post?.users?.id && post.users.id !== me.id) {
				await api.notifications.insert({
					recipient_id: post.users.id,
					actor_id: me.id,
					type: 'comment.created',
					resource_type: 'post',
					resource_id: String(post.id),
					payload: {
						comment_id: new_comment.id,
						post_id: post.id,
						preview: new_comment.content?.slice(0, 80),
					},
					link_url: `/@${post.users?.handle || 'unknown'}/post/${post.id}#comment-${new_comment.id}`,
				});
			}
		} catch (e) {
			console.error('Failed to insert notification (comment.created):', e);
		}
	};

	const handle_reply_added = async ({ parent_comment_id, new_reply }) => {
		// 댓글 배열에서 해당 부모 댓글을 찾아서 답글 추가
		const update_comment_replies = (commentList) => {
			return commentList.map((comment) => {
				if (comment.id === parent_comment_id) {
					return {
						...comment,
						replies: [...(comment.replies || []), new_reply],
					};
				} else if (comment.replies && comment.replies.length > 0) {
					return {
						...comment,
						replies: update_comment_replies(comment.replies),
					};
				}
				return comment;
			});
		};

		comments = update_comment_replies(comments);

		// 앱 레벨 알림 생성: 부모 댓글 작성자에게 (자기 자신 제외)
		try {
			const parent = comments.find((c) => c.id === parent_comment_id);
			const parent_author_id = parent?.user_id;
			if (parent_author_id && parent_author_id !== me.id) {
				await api.notifications.insert({
					recipient_id: parent_author_id,
					actor_id: me.id,
					type: 'comment.reply',
					resource_type: 'post',
					resource_id: String(post.id),
					payload: {
						comment_id: new_reply.id,
						parent_comment_id,
						post_id: post.id,
						preview: new_reply.content?.slice(0, 80),
					},
					link_url: `/@${post.users?.handle || 'unknown'}/post/${post.id}#comment-${new_reply.id}`,
				});
			}
		} catch (e) {
			console.error('Failed to insert notification (comment.reply):', e);
		}
	};

	const handle_gift_comment_added = async ({ gift_content, gift_amount, parent_comment_id, post_id: event_post_id }) => {
		const new_comment = await api.post_comments.insert({
			post_id: post.id,
			user_id: me.id,
			content: gift_content,
			parent_comment_id,
			gift_amount,
		});

		new_comment.post_comment_votes = [];
		new_comment.upvotes = 0;
		new_comment.downvotes = 0;
		new_comment.user_vote = 0;
		new_comment.replies = [];
		new_comment.users = {
			id: me.id,
			handle: me.handle,
			avatar_url: me.avatar_url,
		};

		if (parent_comment_id) {
			// 답글인 경우 해당 댓글의 replies 배열에 추가
			handle_reply_added({
				parent_comment_id,
				new_reply: new_comment,
			});
		} else {
			// 일반 댓글인 경우 comments 배열에 추가
			comments = [...comments, new_comment];
		}
	};

	// Post 이벤트 핸들러 (단일 post 객체용)
	const { handle_bookmark_changed, handle_vote_changed } = create_post_handlers(
		() => [post],  // 배열로 감싸서 전달
		(updated_posts) => {
			post = updated_posts[0];  // 첫 번째(유일한) post 객체 가져오기
		},
		me
	);

	const handle_comment_deleted = ({ comment_id, parent_comment_id }) => {
		if (parent_comment_id) {
			// 답글 삭제 - 중첩된 구조에서 해당 답글 제거
			const remove_reply_from_comments = (commentList) => {
				return commentList.map((comment) => {
					if (comment.id === parent_comment_id) {
						return {
							...comment,
							replies: comment.replies.filter(
								(reply) => reply.id !== comment_id,
							),
						};
					} else if (comment.replies && comment.replies.length > 0) {
						return {
							...comment,
							replies: remove_reply_from_comments(comment.replies),
						};
					}
					return comment;
				});
			};

			comments = remove_reply_from_comments(comments);
		} else {
			// 일반 댓글 삭제 - comments 배열에서 직접 제거
			comments = comments.filter((comment) => comment.id !== comment_id);
		}
	};

	/**
	 * 북마크 토글
	 * Single Source of Truth: post.post_bookmarks 배열만 관리
	 */
	async function toggle_bookmark() {
		if (!check_login(me) || is_bookmarking) return;

		is_bookmarking = true;
		const old_bookmarks = post.post_bookmarks;

		try {
			if (is_bookmarked) {
				// 북마크 제거
				post.post_bookmarks = post.post_bookmarks.filter(
					(bookmark) => bookmark.user_id !== me.id,
				);
				await api.post_bookmarks.delete(post.id, me.id);
			} else {
				// 북마크 추가
				post.post_bookmarks = [...post.post_bookmarks, { user_id: me.id }];
				await api.post_bookmarks.insert(post.id, me.id);
			}
		} catch (error) {
			// Rollback on error
			console.error('Bookmark toggle failed:', error);
			post.post_bookmarks = old_bookmarks;
			show_toast('error', '북마크 처리 중 오류가 발생했습니다.');
		} finally {
			is_bookmarking = false;
		}
	}

	const toggle_follow = async () => {
		if (!check_login(me)) return;

		if (is_following) {
			await api.user_follows.unfollow(me.id, post.users.id);
			me.user_follows = me.user_follows.filter(
				(follow) => follow.following_id !== post.users.id,
			);
		} else {
			await api.user_follows.follow(me.id, post.users.id);
			me.user_follows.push({
				following_id: post.users.id,
			});
		}

		is_following = !is_following;
	};

	const handle_report_submit = async () => {
		if (post_report_form_data.reason === '') {
			show_toast('error', '신고 사유를 선택해주세요.');
			return;
		}

		try {
			await api.post_reports.insert({
				reporter_id: me.id,
				post_id: post.id,
				reason: post_report_form_data.reason,
				details: post_report_form_data.details,
			});

			show_toast('success', '신고가 정상적으로 접수되었습니다.');
		} catch (error) {
			console.error('Failed to submit report:', error);
			show_toast('error', '신고 접수 중 오류가 발생했습니다.');
		} finally {
			modal.report = false;
			post_report_form_data.reason = '';
			post_report_form_data.details = '';
		}
	};
</script>

<svelte:head>
	<title>{post.title} | 문</title>
	<meta name="description" content={(post.content ?? '').slice(0, 160)} />
	<link rel="canonical" href={page_url} />

	<!-- Open Graph -->
	<meta property="og:type" content="article" />
	<meta property="og:url" content={page_url} />
	<meta property="og:title" content={post.title} />
	<meta
		property="og:description"
		content={(post.content ?? '').slice(0, 200)}
	/>
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />

	<!-- Twitter -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:url" content={page_url} />
	<meta name="twitter:title" content={post.title} />
	<meta
		name="twitter:description"
		content={(post.content ?? '').slice(0, 200)}
	/>

	{#if post.images?.length > 0}
		<meta property="og:image" content={post.images[0].uri} />
		<meta name="twitter:image" content={post.images[0].uri} />
	{/if}

	<!-- Article structured data -->
	{@html `<script type="application/ld+json">${JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'Article',
		headline: post.title,
		description: (post.content ?? '').slice(0, 200),
		image: post?.images?.[0]?.uri ? [post.images[0].uri] : undefined,
		author: post?.users?.name ? { '@type': 'Person', name: post.users.name } : undefined,
		datePublished: post?.created_at,
		dateModified: post?.updated_at ?? post?.created_at,
		mainEntityOfPage: page_url
	})}<\/script>`}
</svelte:head>

<Header>
	<button slot="left" class="flex items-center" onclick={smart_go_back}>
		<RiArrowLeftSLine size={28} color={colors.gray[600]} />
	</button>

	<h1 slot="center" class="text-medium">{TITLE}</h1>
	<button
		slot="right"
		onclick={() => {
			if (!check_login(me)) return;

			modal.post_config = true;
		}}
	>
		<Icon attribute="menu" size={24} color={colors.gray[600]} />
	</button>
</Header>

<Post
	{post}
	onGiftCommentAdded={handle_gift_comment_added}
	onBookmarkChanged={handle_bookmark_changed}
	onVoteChanged={handle_vote_changed}
/>

<main>
	<div class="space-y-4 p-4">
		{#each comments as comment (comment.id)}
			<Comment
				post_id={post.id}
				{comment}
				onReplyAdded={handle_reply_added}
				onGiftCommentAdded={handle_gift_comment_added}
				onCommentDeleted={handle_comment_deleted}
			/>
		{/each}
	</div>
</main>

<CommentInput onLeaveComment={leave_post_comment} />

<Modal bind:is_modal_open={modal.post_config} modal_position="bottom">
	<div class="pb-6">
		<!-- 드래그 핸들 -->
		<div class="flex justify-center py-3">
			<div class="h-1 w-10 rounded-full bg-gray-300"></div>
		</div>

		{#if post.users.id === me.id}
			<!-- Own Post Options -->
			<div>
				<a
					href={`/regi/post/${post.id}`}
					class="flex w-full items-center gap-3 px-4 py-4 active:bg-gray-50"
				>
					<RiPencilLine size={20} class="text-gray-500" />
					<span class="text-[15px] text-gray-900">수정하기</span>
				</a>

				<hr class="border-gray-100" />

				<button
					class="flex w-full items-center gap-3 px-4 py-4 active:bg-gray-50"
					onclick={toggle_bookmark}
				>
					{#if is_bookmarked}
						<RiBookmarkFill size={20} class="text-primary" />
						<span class="text-[15px] text-gray-900">저장됨</span>
					{:else}
						<RiBookmarkLine size={20} class="text-gray-500" />
						<span class="text-[15px] text-gray-900">저장하기</span>
					{/if}
				</button>

				<hr class="border-gray-100" />

				<button
					onclick={() => {
						copy_to_clipboard(
							`${window.location.origin}/@${post.users?.handle || 'unknown'}/post/${post.id}`,
							'링크가 복사되었습니다.',
						);
					}}
					class="flex w-full items-center gap-3 px-4 py-4 active:bg-gray-50"
				>
					<Icon attribute="link" size={20} color={colors.gray[500]} />
					<span class="text-[15px] text-gray-900">링크복사</span>
				</button>
			</div>
		{:else}
			<!-- Other's Post Options -->
			<div>
				<button
					class="flex w-full items-center gap-3 px-4 py-4 active:bg-gray-50"
					onclick={toggle_bookmark}
				>
					{#if is_bookmarked}
						<RiBookmarkFill size={20} class="text-primary" />
						<span class="text-[15px] text-gray-900">저장됨</span>
					{:else}
						<RiBookmarkLine size={20} class="text-gray-500" />
						<span class="text-[15px] text-gray-900">저장하기</span>
					{/if}
				</button>

				<hr class="border-gray-100" />

				<button
					class="flex w-full items-center gap-3 px-4 py-4 active:bg-gray-50"
					onclick={toggle_follow}
				>
					{#if is_following}
						<RiUserUnfollowLine size={20} class="text-gray-500" />
						<span class="text-[15px] text-gray-900">팔로우 취소</span>
					{:else}
						<RiUserFollowLine size={20} class="text-gray-500" />
						<span class="text-[15px] text-gray-900">팔로우</span>
					{/if}
				</button>

				<hr class="border-gray-100" />

				<button
					onclick={() => {
						copy_to_clipboard(
							`${window.location.origin}/@${post.users?.handle || 'unknown'}/post/${post.id}`,
							'링크가 복사되었습니다.',
						);
					}}
					class="flex w-full items-center gap-3 px-4 py-4 active:bg-gray-50"
				>
					<Icon attribute="link" size={20} color={colors.gray[500]} />
					<span class="text-[15px] text-gray-900">링크복사</span>
				</button>

				<hr class="border-gray-100" />

				<button
					onclick={() => (modal.report = true)}
					class="flex w-full items-center gap-3 px-4 py-4 active:bg-gray-50"
				>
					<Icon attribute="exclamation" size={20} color="#ef4444" />
					<span class="text-[15px] text-red-500">신고하기</span>
				</button>
			</div>
		{/if}
	</div>
</Modal>

<Modal bind:is_modal_open={modal.report} modal_position="center">
	<div class="p-5">
		<p class="text-[16px] font-semibold text-gray-900">무엇을 신고하시나요?</p>
		<p class="mt-1 text-[13px] text-gray-500">
			커뮤니티 가이드라인에 어긋나는 내용을 알려주세요.
		</p>

		<div class="mt-4 space-y-2">
			{#each REPORT_REASONS as reason}
				<label class="flex cursor-pointer items-center rounded-lg px-3 py-2.5 active:bg-gray-50">
					<input
						type="radio"
						name="report_reason"
						value={reason}
						bind:group={post_report_form_data.reason}
						class="h-4 w-4 accent-blue-500"
					/>
					<span class="ml-3 text-[14px] text-gray-900">{reason}</span>
				</label>
			{/each}
		</div>

		<textarea
			bind:value={post_report_form_data.details}
			class="mt-4 w-full rounded-lg border border-gray-200 px-4 py-3 text-[15px] text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none"
			placeholder="상세 내용을 입력해주세요 (선택)"
			rows="3"
		></textarea>

		<div class="mt-5 flex gap-2">
			<button
				onclick={() => (modal.report = false)}
				class="flex-1 rounded-lg bg-gray-100 py-3 text-[14px] font-medium text-gray-700 active:bg-gray-200"
			>
				취소
			</button>
			<button
				onclick={handle_report_submit}
				class="flex-1 rounded-lg bg-red-500 py-3 text-[14px] font-medium text-white active:bg-red-600"
			>
				신고하기
			</button>
		</div>
	</div>
</Modal>
