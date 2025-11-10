<script>
	import colors from '$lib/config/colors';
	import {
		get_api_context,
		get_user_context,
	} from '$lib/contexts/app_context.svelte.js';
	import profile_png from '$lib/img/common/user/profile.png';
	import {
		check_login,
		copy_to_clipboard,
		format_date,
		show_toast,
	} from '$lib/utils/common';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import {
		RiBookmarkFill,
		RiBookmarkLine,
		RiPencilLine,
		RiThumbDownFill,
		RiThumbDownLine,
		RiThumbUpFill,
		RiThumbUpLine,
		RiUserFollowLine,
		RiUserUnfollowLine,
	} from 'svelte-remixicon';

	import CustomCarousel from '$lib/components/ui/Carousel.svelte';
	import GiftModal from '$lib/components/ui/GiftModal.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';

	// ===== Context =====
	const me = get_user_context();
	const api = get_api_context();

	// ===== Constants =====
	const REPORT_REASONS = [
		'스팸/광고성 콘텐츠입니다.',
		'욕설/혐오 발언을 사용했습니다.',
		'선정적인 내용을 포함하고 있습니다.',
		'잘못된 정보를 포함하고 있습니다.',
		'기타',
	];

	const VIDEO_EXTENSIONS = /\.(mp4|mov|webm|ogg)$/i;

	const VOTE_TYPE = {
		LIKE: 1,
		DISLIKE: -1,
		NEUTRAL: 0,
	};

	// ===== Props & Callbacks =====
	/**
	 * @typedef {Object} Post
	 * @property {string} id - 게시물 ID
	 * @property {string} title - 게시물 제목
	 * @property {string} content - 게시물 내용
	 * @property {number} like_count - 좋아요 수
	 * @property {Array} post_votes - 투표 정보
	 * @property {Array} post_bookmarks - 북마크 정보
	 * @property {Array} [post_comments] - 댓글 정보
	 * @property {Array} [images] - 이미지 목록
	 * @property {Object} users - 작성자 정보
	 * @property {string} [community_id] - 커뮤니티 ID
	 * @property {Object} [communities] - 커뮤니티 정보
	 * @property {string} created_at - 생성 시간
	 */

	/**
	 * @typedef {Function} BookmarkCallback
	 * @param {Object} event - 북마크 이벤트
	 * @param {string} event.post_id - 게시물 ID
	 * @param {Array} event.bookmarks - 북마크 배열
	 */

	/**
	 * @typedef {Function} VoteCallback
	 * @param {Object} event - 투표 이벤트
	 * @param {string} event.post_id - 게시물 ID
	 * @param {number} event.user_vote - 사용자 투표 값
	 * @param {number} event.like_count - 좋아요 수
	 */

	/**
	 * @typedef {Function} GiftCallback
	 * @param {Object} event - 선물 이벤트
	 * @param {string} event.gift_content - 선물 메시지
	 * @param {number} event.gift_moon_point - 선물 포인트
	 * @param {string} event.post_id - 게시물 ID
	 */

	/** @type {{ post: Post, onBookmarkChanged?: BookmarkCallback, onVoteChanged?: VoteCallback, onGiftCommentAdded?: GiftCallback }} */
	let { post, onBookmarkChanged, onVoteChanged, onGiftCommentAdded } = $props();

	// ===== State: Vote =====
	let like_count = $state(post.like_count ?? 0);
	let local_user_vote = $state(null);
	let is_voting = $state(false);

	// ===== State: Bookmark =====
	let is_bookmarking = $state(false);

	// ===== State: Follow =====
	let is_following = $state(false);

	// ===== State: Modals =====
	let modal = $state({
		post_config: false,
		gift: false,
		report: false,
	});

	// ===== State: Report Form =====
	let report_form = $state({
		reason: '',
		details: '',
	});

	// ===== Computed Values =====
	const author_handle = post.users?.handle || 'unknown';
	const post_url = `/@${author_handle}/post/${post.id}`;
	const full_post_url = `${window.location.origin}${post_url}`;

	/**
	 * 사용자 투표 상태
	 * @type {number} - 1: 좋아요, -1: 싫어요, 0: 투표 안 함
	 */
	let user_vote = $derived(
		local_user_vote !== null
			? local_user_vote
			: me?.id && post.post_votes
				? (post.post_votes.find((vote) => vote.user_id === me.id)?.vote ?? 0)
				: 0,
	);

	/**
	 * 북마크 상태
	 * @type {boolean}
	 */
	let is_bookmarked = $derived(
		me?.id && post.post_bookmarks
			? post.post_bookmarks.some((bookmark) => bookmark.user_id === me.id)
			: false,
	);

	/**
	 * 상세 페이지 여부
	 * @type {boolean}
	 */
	let is_detail_page = $derived(
		$page.url.pathname.match(/^\/@[^/]+\/post\/[^/]+$/),
	);

	// ===== Lifecycle =====
	onMount(async () => {
		await initialize_user_data();
	});

	/**
	 * 컴포넌트 마운트 시 사용자 데이터 초기화
	 * @returns {Promise<void>}
	 */
	async function initialize_user_data() {
		if (!me?.id) return;

		if (post.users?.id) {
			is_following = await api.user_follows.is_following(me.id, post.users.id);
		}

		await sync_vote_state();
	}

	/**
	 * 서버에서 최신 투표 상태를 가져와 동기화
	 * @returns {Promise<void>}
	 */
	async function sync_vote_state() {
		try {
			const current_vote = await api.post_votes.get_user_vote(post.id, me.id);
			const existing_vote =
				post.post_votes?.find((vote) => vote.user_id === me.id)?.vote ?? 0;

			if (current_vote !== existing_vote) {
				local_user_vote = current_vote;
			}
		} catch (error) {
			console.error('Failed to sync vote state:', error);
		}
	}

	// ===== Vote Handlers =====

	/**
	 * 투표 처리 (좋아요/싫어요)
	 * @param {number} new_vote - 1: 좋아요, -1: 싫어요, 0: 취소
	 * @returns {Promise<void>}
	 */
	async function handle_vote(new_vote) {
		if (!check_login(me) || is_voting) return;

		is_voting = true;
		const old_vote = user_vote;
		const old_like_count = like_count;

		update_vote_ui(old_vote, new_vote);

		try {
			await api.post_votes.handle_vote(post.id, me.id, local_user_vote);

			if (should_send_like_notification(old_vote, local_user_vote)) {
				await send_like_notification();
			}

			onVoteChanged?.({
				post_id: post.id,
				user_vote: local_user_vote,
				like_count,
			});
		} catch (error) {
			console.error('Vote failed:', error);
			local_user_vote = old_vote === 0 ? null : old_vote;
			like_count = old_like_count;
			show_toast('error', '투표 처리 중 오류가 발생했습니다.');
		} finally {
			is_voting = false;
		}
	}

	/**
	 * 투표 UI 업데이트 (Optimistic Update)
	 * @param {number} old_vote - 이전 투표 값
	 * @param {number} new_vote - 새 투표 값
	 */
	function update_vote_ui(old_vote, new_vote) {
		if (old_vote === new_vote) {
			local_user_vote = VOTE_TYPE.NEUTRAL;
			if (new_vote === VOTE_TYPE.LIKE) like_count--;
		} else {
			local_user_vote = new_vote;
			if (old_vote === VOTE_TYPE.LIKE) like_count--;
			if (new_vote === VOTE_TYPE.LIKE) like_count++;
		}
	}

	/**
	 * 좋아요 알림 전송 여부 확인
	 * @param {number} old_vote - 이전 투표 값
	 * @param {number} new_vote - 새 투표 값
	 * @returns {boolean}
	 */
	function should_send_like_notification(old_vote, new_vote) {
		return (
			old_vote !== VOTE_TYPE.LIKE &&
			new_vote === VOTE_TYPE.LIKE &&
			post.users?.id &&
			post.users.id !== me.id
		);
	}

	/**
	 * 좋아요 알림 전송
	 * @returns {Promise<void>}
	 */
	async function send_like_notification() {
		try {
			await api.notifications.insert({
				recipient_id: post.users.id,
				actor_id: me.id,
				type: 'post.liked',
				resource_type: 'post',
				resource_id: String(post.id),
				payload: { post_id: post.id, post_title: post.title },
				link_url: post_url,
			});
		} catch (error) {
			console.error('Failed to send like notification:', error);
		}
	}

	// ===== Bookmark Handlers =====

	/**
	 * 북마크 토글
	 * @returns {Promise<void>}
	 */
	async function toggle_bookmark() {
		if (!check_login(me) || is_bookmarking) return;

		is_bookmarking = true;
		const old_bookmarks = post.post_bookmarks;

		try {
			if (is_bookmarked) {
				post.post_bookmarks = post.post_bookmarks.filter(
					(bookmark) => bookmark.user_id !== me.id,
				);
				await api.post_bookmarks.delete(post.id, me.id);
			} else {
				post.post_bookmarks = [...post.post_bookmarks, { user_id: me.id }];
				await api.post_bookmarks.insert(post.id, me.id);
			}

			onBookmarkChanged?.({
				post_id: post.id,
				bookmarks: post.post_bookmarks,
			});
		} catch (error) {
			console.error('Bookmark toggle failed:', error);
			post.post_bookmarks = old_bookmarks;
			show_toast('error', '북마크 처리 중 오류가 발생했습니다.');
		} finally {
			is_bookmarking = false;
		}
	}

	// ===== Follow Handlers =====

	/**
	 * 팔로우 토글
	 * @returns {Promise<void>}
	 */
	async function toggle_follow() {
		if (!check_login(me) || !post.users?.id) return;

		try {
			if (is_following) {
				await api.user_follows.unfollow(me.id, post.users.id);
				me.user_follows = me.user_follows.filter(
					(follow) => follow.following_id !== post.users.id,
				);
			} else {
				await api.user_follows.follow(me.id, post.users.id);
				me.user_follows = [...me.user_follows, { following_id: post.users.id }];
			}
			is_following = !is_following;
		} catch (error) {
			console.error('Follow toggle failed:', error);
			show_toast('error', '팔로우 처리 중 오류가 발생했습니다.');
		}
	}

	// ===== Report Handlers =====

	/**
	 * 신고 제출
	 * @returns {Promise<void>}
	 */
	async function submit_report() {
		if (!report_form.reason) {
			show_toast('error', '신고 사유를 선택해주세요.');
			return;
		}

		try {
			await api.post_reports.insert({
				reporter_id: me.id,
				post_id: post.id,
				reason: report_form.reason,
				details: report_form.details,
			});

			show_toast('success', '신고가 정상적으로 접수되었습니다.');
			reset_report_form();
		} catch (error) {
			console.error('Failed to submit report:', error);
			show_toast('error', '신고 접수 중 오류가 발생했습니다.');
		}
	}

	/**
	 * 신고 폼 리셋
	 */
	function reset_report_form() {
		modal.report = false;
		report_form.reason = '';
		report_form.details = '';
	}

	// ===== Gift Handlers =====

	/**
	 * 선물 댓글 추가 성공 처리
	 * @param {Object} params - 선물 파라미터
	 * @param {string} params.gift_content - 선물 메시지
	 * @param {number} params.gift_moon_point - 선물 포인트
	 * @param {string} params.post_id - 게시물 ID
	 */
	function handle_gift_success({ gift_content, gift_moon_point, post_id }) {
		onGiftCommentAdded?.({
			gift_content,
			gift_moon_point,
			parent_comment_id: null,
			post_id: post.id,
		});

		modal.gift = false;
	}

	// ===== Utility Functions =====

	/**
	 * 비디오 파일 여부 확인
	 * @param {string} uri - 파일 URI
	 * @returns {boolean}
	 */
	function is_video(uri) {
		return VIDEO_EXTENSIONS.test(uri);
	}

	/**
	 * 링크 복사
	 */
	function copy_post_link() {
		copy_to_clipboard(full_post_url, '링크가 복사되었습니다.');
	}

	/**
	 * 설정 모달 열기
	 */
	function open_config_modal() {
		if (!check_login(me)) return;
		modal.post_config = true;
	}
</script>

<!-- Post Article -->

<article class="px-4">
	<!-- Post Header: Author Info & Actions -->
	<div class="flex items-center justify-between">
		<a href={`/@${author_handle}`} class="flex items-center">
			<img
				src={post.users?.avatar_url ?? profile_png}
				alt={post.users?.name || 'Unknown User'}
				class="mr-2 block aspect-square h-8 w-8 rounded-full object-cover"
				loading="lazy"
			/>
			<p class="pr-3 text-sm font-medium">
				{post.users?.name || 'Unknown User'}
			</p>
			<p class="mt-0.5 text-xs text-gray-400">{format_date(post.created_at)}</p>
		</a>

		<!-- Follow Button (Detail Page Only) -->
		{#if $page.params.post_id}
			{#if post.users?.id && post.users.id !== me.id}
				{#if is_following}
					<button class="btn btn-sm h-6" onclick={toggle_follow}>팔로잉</button>
				{:else}
					<button class="btn btn-sm btn-primary h-6" onclick={toggle_follow}
						>팔로우</button
					>
				{/if}
			{/if}
		{:else}
			<button onclick={open_config_modal}>
				<Icon attribute="ellipsis" size={20} color={colors.gray[500]} />
			</button>
		{/if}
	</div>

	<!-- Post Title -->
	<a href={post_url} class="mt-2 line-clamp-2 font-semibold">
		{post.title}
	</a>

	<!-- Post Content -->
	<div>
		{#if is_detail_page}
			<!-- Detail Page: Full Content -->
			{#if post.images?.length > 0}
				<figure class="mt-2">
					{#if is_video(post.images[0].uri)}
						<video
							src={post.images[0].uri}
							controls
							class="w-full rounded-lg"
							style="max-height: 320px;"
						>
							<track kind="captions" label="No captions" />
						</video>
					{:else}
						<CustomCarousel images={post.images.map((img) => img.uri)} />
					{/if}
				</figure>
			{/if}
			<div
				class="prose prose-sm mt-2 max-w-none text-sm"
				style="white-space: pre-wrap;"
			>
				{@html post.content}
			</div>
		{:else if post.images?.length > 0}
			<!-- List Page: Images Only -->
			<figure class="mt-2">
				{#if is_video(post.images[0].uri)}
					<video
						src={post.images[0].uri}
						controls
						class="w-full rounded-lg"
						style="max-height: 320px;"
					>
						<track kind="captions" label="No captions" />
					</video>
				{:else}
					<CustomCarousel images={post.images.map((img) => img.uri)} />
				{/if}
			</figure>
		{:else}
			<!-- List Page: Preview with Fade -->
			<a href={post_url}>
				<div
					class="prose prose-sm mt-2 max-w-none text-sm"
					style="max-height: 10rem; overflow: hidden; position: relative;"
				>
					{@html post.content}
					<div
						style="position: absolute; bottom: 0; left: 0; right: 0; height: 2rem; background: linear-gradient(transparent, white); pointer-events: none;"
					></div>
				</div>
			</a>
		{/if}

		<!-- Community Badge -->
		{#if post.community_id}
			<a
				href={`/community/${post.communities.slug}`}
				class="mt-2 inline-block rounded bg-gray-100 px-2 py-1 text-[11px]"
			>
				{post.communities.title}
			</a>
		{/if}
	</div>

	<!-- Action Buttons: Vote, Comment, Gift, Bookmark -->
	<div class="mt-3 flex items-center justify-between text-sm text-gray-400">
		<div class="flex">
			<!-- Like Button -->
			<button
				class="mr-3 flex items-center gap-1"
				onclick={() => handle_vote(VOTE_TYPE.LIKE)}
				aria-label="좋아요"
			>
				{#if user_vote === VOTE_TYPE.LIKE}
					<RiThumbUpFill size={16} color={colors.primary} />
				{:else}
					<RiThumbUpLine size={16} color={colors.gray[400]} />
				{/if}
				<p>{like_count}</p>
			</button>

			<!-- Dislike Button -->
			<button
				class="mr-4 flex items-center gap-1"
				onclick={() => handle_vote(VOTE_TYPE.DISLIKE)}
				aria-label="싫어요"
			>
				{#if user_vote === VOTE_TYPE.DISLIKE}
					<RiThumbDownFill size={16} color={colors.warning} />
				{:else}
					<RiThumbDownLine size={16} color={colors.gray[400]} />
				{/if}
			</button>

			<!-- Comment Count -->
			<a href={post_url} class="mr-4 flex items-center gap-1" aria-label="댓글">
				<Icon attribute="chat_bubble" size={16} color={colors.gray[400]} />
				<p>{post.post_comments?.[0]?.count ?? 0}</p>
			</a>

			<!-- Gift Button -->
			<button
				class="flex items-center gap-1"
				onclick={() => {
					if (!check_login(me)) return;
					modal.gift = true;
				}}
				aria-label="선물하기"
			>
				<Icon attribute="gift" size={16} color={colors.gray[400]} />
			</button>
		</div>

		<!-- Bookmark Button -->
		<button
			class="flex items-center gap-1"
			onclick={toggle_bookmark}
			aria-label={is_bookmarked ? '북마크 해제' : '북마크'}
		>
			{#if is_bookmarked}
				<RiBookmarkFill size={16} color={colors.primary} />
			{:else}
				<RiBookmarkLine size={16} color={colors.gray[400]} />
			{/if}
		</button>
	</div>
</article>

<hr class="mt-2 border-gray-300" />

<!-- Config Modal -->

<Modal bind:is_modal_open={modal.post_config} modal_position="bottom">
	<div class="flex flex-col items-center bg-gray-100 p-4 text-sm font-medium">
		{#if post.users?.id === me.id}
			<!-- Own Post Options -->
			<div class="flex w-full flex-col items-center rounded-lg bg-white">
				<a
					href={`/regi/post/${post.id}`}
					class="flex w-full items-center gap-3 p-3"
				>
					<RiPencilLine size={20} color={colors.gray[400]} />
					<p class="text-gray-600">수정하기</p>
				</a>

				<hr class="w-full border-gray-100" />

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
				onclick={copy_post_link}
				class="mt-4 flex w-full flex-col items-center rounded-lg bg-white"
			>
				<div class="flex w-full items-center gap-3 p-3">
					<Icon attribute="link" size={20} color={colors.gray[600]} />
					<p class="text-gray-600">링크복사</p>
				</div>
			</button>
		{:else}
			<!-- Other's Post Options -->
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

				<hr class="w-full border-gray-100" />

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
				onclick={copy_post_link}
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

<!-- Report Modal -->
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
						bind:group={report_form.reason}
						class="radio radio-primary radio-xs"
					/>
					<span class="ml-2">{reason}</span>
				</label>
			{/each}
		</div>

		<textarea
			bind:value={report_form.details}
			class="textarea textarea-bordered focus:border-primary mt-4 w-full focus:outline-none"
			placeholder="상세 내용을 입력해주세요. (선택 사항)"
			rows="3"
		></textarea>
	</div>
	<div class="flex">
		<button onclick={reset_report_form} class="btn w-1/3 rounded-none"
			>취소</button
		>
		<button onclick={submit_report} class="btn btn-primary w-2/3 rounded-none"
			>제출</button
		>
	</div>
</Modal>

<!-- Gift Modal -->
<GiftModal
	bind:is_modal_open={modal.gift}
	receiver_id={post.users?.id}
	receiver_name={post.users?.name || 'Unknown User'}
	post_id={post.id}
	onGiftSuccess={handle_gift_success}
/>

<style>
	/* Rich text content styles */
	:global(.prose h1) {
		font-size: 1.5rem !important;
		font-weight: bold !important;
		margin: 1rem 0 0.5rem 0 !important;
		line-height: 1.2 !important;
	}

	:global(.prose h2) {
		font-size: 1.25rem !important;
		font-weight: bold !important;
		margin: 0.8rem 0 0.4rem 0 !important;
		line-height: 1.3 !important;
	}

	:global(.prose h3) {
		font-size: 1.125rem !important;
		font-weight: bold !important;
		margin: 0.6rem 0 0.3rem 0 !important;
		line-height: 1.4 !important;
	}

	:global(.prose p) {
		margin: 0.75rem 0 !important;
		line-height: 1.6 !important;
		white-space: normal !important;
		display: block !important;
		min-height: 1.2em !important;
	}

	:global(.prose strong) {
		font-weight: bold !important;
	}

	:global(.prose em) {
		font-style: italic !important;
	}

	:global(.prose ul, .prose ol) {
		padding-left: 1.5rem !important;
		margin: 0.5rem 0 !important;
	}

	:global(.prose li) {
		margin: 0.25rem 0 !important;
	}

	:global(.prose blockquote) {
		border-left: 4px solid #e5e7eb !important;
		padding-left: 1rem !important;
		margin: 1rem 0 !important;
		font-style: italic !important;
		color: #6b7280 !important;
	}

	:global(.prose img) {
		max-width: 100% !important;
		height: auto !important;
		margin: 1rem auto !important;
		border-radius: 0.5rem !important;
		display: block !important;
	}

	:global(.prose a) {
		color: #3b82f6 !important;
		text-decoration: underline !important;
	}

	:global(.prose code) {
		background-color: #f3f4f6 !important;
		padding: 0.125rem 0.25rem !important;
		border-radius: 0.25rem !important;
		font-size: 0.875em !important;
	}

	:global(.prose pre) {
		background-color: #f3f4f6 !important;
		padding: 1rem !important;
		border-radius: 0.5rem !important;
		overflow-x: auto !important;
		margin: 1rem 0 !important;
	}

	:global(.prose br) {
		display: block !important;
		margin: 0.25rem 0 !important;
		line-height: 0 !important;
	}

	:global(.prose .hard-break) {
		display: block !important;
		height: 0.5rem !important;
	}

	:global(.prose p:empty) {
		margin: 0.75rem 0 !important;
		min-height: 1.2em !important;
		display: block !important;
	}
</style>
