<script>
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { smartGoBack } from '$lib/utils/navigation';
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

	import CustomCarousel from '$lib/components/ui/Carousel/+page.svelte';
	import CommentInput from '$lib/components/ui/CommentInput/+page.svelte';
	import Header from '$lib/components/ui/Header/+page.svelte';
	import Icon from '$lib/components/ui/Icon/+page.svelte';
	import Modal from '$lib/components/ui/Modal/+page.svelte';
	import Comment from '$lib/components/Comment/+page.svelte';
	import Post from '$lib/components/Post/+page.svelte';

	import colors from '$lib/js/colors';
	import { check_login, copy_to_clipboard, show_toast } from '$lib/js/common';
	import { get_user_context, get_api_context } from '$lib/contexts/app-context.svelte.js';

	const { me } = get_user_context();
	const { api } = get_api_context();

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

	const leave_post_comment = async (event) => {
		const { content } = event.detail;
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

	const handle_reply_added = async (event) => {
		const { parent_comment_id, new_reply } = event.detail;

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

	const handle_gift_comment_added = async (event) => {
		const { gift_content, gift_moon_point, parent_comment_id } = event.detail;

		const new_comment = await api.post_comments.insert({
			post_id: post.id,
			user_id: me.id,
			content: gift_content,
			parent_comment_id,
			gift_moon_point,
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
				detail: { parent_comment_id, new_reply: new_comment },
			});
		} else {
			// 일반 댓글인 경우 comments 배열에 추가
			comments = [...comments, new_comment];
		}
	};

	const handle_comment_deleted = (event) => {
		const { comment_id, parent_comment_id } = event.detail;

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
		if (!check_login() || is_bookmarking) return;

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
		if (!check_login()) return;

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
	<script type="application/ld+json">
        {JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: post.title,
            description: (post.content ?? '').slice(0, 200),
            image: post?.images?.[0]?.uri ? [post.images[0].uri] : undefined,
            author: post?.users?.name ? { '@type': 'Person', name: post.users.name } : undefined,
            datePublished: post?.created_at,
            dateModified: post?.updated_at ?? post?.created_at,
            mainEntityOfPage: page_url
        })}
	</script>
</svelte:head>

<Header>
	<button slot="left" class="flex items-center" onclick={smartGoBack}>
		<RiArrowLeftSLine size={28} color={colors.gray[600]} />
	</button>

	<h1 slot="center" class="text-medium">{TITLE}</h1>
	<button
		slot="right"
		onclick={() => {
			if (!check_login()) return;

			modal.post_config = true;
		}}
	>
		<Icon attribute="menu" size={24} color={colors.gray[600]} />
	</button>
</Header>

<Post {post} on:gift_comment_added={handle_gift_comment_added} />

<main>
	<div class="space-y-4 p-4">
		{#each comments as comment (comment.id)}
			<Comment
				post_id={post.id}
				{comment}
				on:reply_added={handle_reply_added}
				on:gift_comment_added={handle_gift_comment_added}
				on:comment_deleted={handle_comment_deleted}
			/>
		{/each}
	</div>
</main>

<CommentInput on:leave_comment={leave_post_comment} />

<Modal bind:is_modal_open={modal.post_config} modal_position="bottom">
	<div class="flex flex-col items-center bg-gray-100 p-4 text-sm font-medium">
		{#if post.users.id === me.id}
			<div class="flex w-full flex-col items-center rounded-lg bg-white">
				<a
					href={`/regi/post/${post.id}`}
					class="flex w-full items-center gap-3 p-3"
				>
					<RiPencilLine size={20} color={colors.gray[400]} />
					<p class="text-gray-600">수정하기</p>
				</a>

				<hr class=" w-full border-gray-100" />

				<button
					class="flex w-full items-center gap-3 p-3"
					onclick={toggle_bookmark}
				>
					{#if is_bookmarked}
						<RiBookmarkFill size={20} color={colors.primary} />
						<p class="text-gray-600">저장됨</p>
					{:else}
						<RiBookmarkLine size={20} color={colors.gray[400]} />
						<p class="text-gray-600">저장하기</p>
					{/if}
				</button>
			</div>

			<button
				onclick={() => {
					copy_to_clipboard(
						`${window.location.origin}/@${post.users?.handle || 'unknown'}/post/${post.id}`,
						'링크가 복사되었습니다.',
					);
				}}
				class="mt-4 flex w-full flex-col items-center rounded-lg bg-white"
			>
				<div class="flex w-full items-center gap-3 p-3">
					<Icon attribute="link" size={20} color={colors.gray[600]} />

					<p class="text-gray-600">링크복사</p>
				</div>
			</button>

			<!-- <button
				onclick={() => {}}
				class="mt-4 flex w-full flex-col items-center rounded-lg bg-white"
			>
				<div class="flex w-full items-center gap-3 p-3">
				<RiDeleteBinLine size={20} color={colors.warning} />
				<p class="text-red-500">삭제하기</p>
				</div>
			</button> -->
		{:else}
			<div class="flex w-full flex-col items-center rounded-lg bg-white">
				<button
					class="flex w-full items-center gap-3 p-3"
					onclick={toggle_bookmark}
				>
					{#if is_bookmarked}
						<RiBookmarkFill size={20} color={colors.primary} />
						<p class="text-gray-600">저장됨</p>
					{:else}
						<RiBookmarkLine size={20} color={colors.gray[600]} />
						<p class="text-gray-600">저장하기</p>
					{/if}
				</button>

				<hr class=" w-full border-gray-100" />

				<button
					class="flex w-full items-center gap-3 p-3"
					onclick={toggle_follow}
				>
					{#if is_following}
						<RiUserUnfollowLine size={20} color={colors.gray[600]} />
						<p class="text-gray-600">팔로우 취소</p>
					{:else}
						<RiUserFollowLine size={20} color={colors.gray[600]} />
						<p class="text-gray-600">팔로우</p>
					{/if}
				</button>
			</div>

			<button
				onclick={() => {
					copy_to_clipboard(
						`${window.location.origin}/@${post.users?.handle || 'unknown'}/post/${post.id}`,
						'링크가 복사되었습니다.',
					);
				}}
				class="mt-4 flex w-full flex-col items-center rounded-lg bg-white"
			>
				<div class="flex w-full items-center gap-3 p-3">
					<Icon attribute="link" size={20} color={colors.gray[600]} />

					<p class="text-gray-600">링크복사</p>
				</div>
			</button>

			<button
				onclick={() => (modal.report = true)}
				class="mt-4 flex w-full flex-col items-center rounded-lg bg-white"
			>
				<div class="flex w-full items-center gap-2 p-3">
					<Icon attribute="exclamation" size={24} color={colors.warning} />
					<p class="text-red-500">신고하기</p>
				</div>
			</button>
		{/if}
	</div>
</Modal>

<Modal bind:is_modal_open={modal.report} modal_position="center">
	<div class="p-4">
		<h2 class="text-lg font-bold">무엇을 신고하시나요?</h2>
		<p class="mt-1 text-sm text-gray-500">
			커뮤니티 가이드라인에 어긋나는 내용을 알려주세요.
		</p>

		<div class="mt-4 space-y-2">
			{#each REPORT_REASONS as reason}
				<label class="flex items-center">
					<input
						type="radio"
						name="report_reason"
						value={reason}
						bind:group={post_report_form_data.reason}
						class="radio radio-primary radio-xs"
					/>
					<span class="ml-2">{reason}</span>
				</label>
			{/each}
		</div>

		<textarea
			bind:value={post_report_form_data.details}
			class="textarea textarea-bordered focus:border-primary mt-4 w-full focus:outline-none"
			placeholder="상세 내용을 입력해주세요. (선택 사항)"
			rows="3"
		></textarea>
	</div>
	<div class="flex">
		<button
			onclick={() => (modal.report = false)}
			class="btn w-1/3 rounded-none"
		>
			취소
		</button>
		<button
			onclick={handle_report_submit}
			class="btn btn-primary w-2/3 rounded-none"
		>
			제출
		</button>
	</div>
</Modal>
