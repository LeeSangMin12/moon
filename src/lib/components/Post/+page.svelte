<script>
	import profile_png from '$lib/img/common/user/profile.png';
	import { page } from '$app/stores';
	import { createEventDispatcher, onMount } from 'svelte';
	import {
		RiBookmarkFill,
		RiBookmarkLine,
		RiCloseLine,
		RiDeleteBinLine,
		RiMoonFill,
		RiPencilLine,
		RiThumbDownFill,
		RiThumbDownLine,
		RiThumbUpFill,
		RiThumbUpLine,
		RiUserFollowLine,
		RiUserUnfollowLine,
		RiWindowLine,
	} from 'svelte-remixicon';

	import CustomCarousel from '$lib/components/ui/Carousel/+page.svelte';
	import GiftModal from '$lib/components/ui/GiftModal/+page.svelte';
	import Icon from '$lib/components/ui/Icon/+page.svelte';
	import Modal from '$lib/components/ui/Modal/+page.svelte';

	import colors from '$lib/js/colors';
	import {
		check_login,
		comma,
		copy_to_clipboard,
		format_date,
		show_toast,
	} from '$lib/js/common';
	import { api_store } from '$lib/store/api_store';
	import { update_global_store } from '$lib/store/global_store.js';
	import { user_store } from '$lib/store/user_store';

	const dispatch = createEventDispatcher();

	let { post } = $props();

	const REPORT_REASONS = [
		'스팸/광고성 콘텐츠입니다.',
		'욕설/혐오 발언을 사용했습니다.',
		'선정적인 내용을 포함하고 있습니다.',
		'잘못된 정보를 포함하고 있습니다.',
		'기타',
	];

	let like_count = $state(post.like_count ?? 0);
	let user_vote = $state(
		post.post_votes?.find((vote) => vote.user_id === $user_store.id)?.vote ?? 0,
	);
	let is_bookmarked = $state(
		post.post_bookmarks?.find((bookmark) => bookmark.user_id === $user_store.id)
			? true
			: false,
	);
	let is_following = $state(false);

	let post_report_form_data = $state({
		reason: '',
		details: '',
	});

	let modal = $state({
		post_config: false,
		gift: false,
		report: false,
	});

	onMount(async () => {
		if ($user_store?.id) {
			is_following = await $api_store.user_follows.is_following(
				$user_store.id,
				post.users.id,
			);
		}
	});

	const on_vote = async (new_vote) => {
		const old_vote = user_vote;

		if (old_vote === new_vote) {
			user_vote = 0;
			if (new_vote === 1) like_count--;
		} else {
			// 변경/새 투표 로직
			user_vote = new_vote;

			if (old_vote === 1) like_count--;
			if (new_vote === 1) like_count++;
		}

		await $api_store.post_votes.handle_vote(post.id, $user_store.id, user_vote);
	};

	const toggle_bookmark = async () => {
		if (!check_login()) return;

		if (is_bookmarked) {
			await $api_store.post_bookmarks.delete(post.id, $user_store.id);
		} else {
			await $api_store.post_bookmarks.insert(post.id, $user_store.id);
		}

		is_bookmarked = !is_bookmarked;
	};

	const toggle_follow = async () => {
		if (!check_login()) return;

		if (is_following) {
			await $api_store.user_follows.unfollow($user_store.id, post.users.id);
			$user_store.user_follows = $user_store.user_follows.filter(
				(follow) => follow.following_id !== post.users.id,
			);
		} else {
			await $api_store.user_follows.follow($user_store.id, post.users.id);
			$user_store.user_follows.push({
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
			await $api_store.post_reports.insert({
				reporter_id: $user_store.id,
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

	async function handle_gift_success(event) {
		const { gift_content, gift_moon_point } = event.detail;

		// 상위 컴포넌트에 gift 댓글 추가 알림 (일반 댓글로 추가)
		dispatch('gift_comment_added', {
			gift_content,
			gift_moon_point,
			parent_comment_id: null, // 포스트에 대한 일반 댓글
			post_id: post.id, // post_id 추가
		});

		modal.gift = false;
	}

	const is_video = (uri) => {
		return /\.(mp4|mov|webm|ogg)$/i.test(uri);
	};
</script>

<article class="px-4">
	<div class="flex items-center justify-between">
		<a href={`/@${post.users.handle}`} class="flex items-center">
			<img
				src={post.users.avatar_url ?? profile_png}
				alt={post.users.name}
				class="mr-2 block aspect-square h-8 w-8 rounded-full object-cover"
			/>

			<p class="pr-3 text-sm font-medium">{post.users.name}</p>
			<p class="mt-0.5 text-xs text-gray-400">{format_date(post.created_at)}</p>
		</a>

		{#if $page.params.post_id}
			{#if post.users.id !== $user_store.id}
				{#if is_following}
					<button class="btn btn-sm h-6" onclick={toggle_follow}>팔로잉</button>
				{:else}
					<button class="btn btn-sm btn-primary h-6" onclick={toggle_follow}
						>팔로우</button
					>
				{/if}
			{/if}
		{:else}
			<button
				onclick={() => {
					if (!check_login()) return;

					modal.post_config = true;
				}}
			>
				<Icon attribute="ellipsis" size={20} color={colors.gray[500]} />
			</button>
		{/if}
	</div>

	<!-- 제목 -->
	<a
		href={`/@${post.users.handle}/post/${post.id}`}
		class="mt-2 line-clamp-2 font-semibold"
	>
		{post.title}
	</a>

	<div>
		<!-- 본문 -->
		{#if $page.url.pathname.match(/^\/@[^/]+\/post\/[^/]+$/)}
			{#if post.images?.length > 0}
				{#if is_video(post.images[0].uri)}
					<figure class="mt-2">
						<video
							src={post.images[0].uri}
							controls
							class="w-full rounded-lg"
							style="max-height: 320px;"
						>
							<track kind="captions" label="No captions" />
						</video>
					</figure>
				{:else}
					<figure class="mt-2">
						<CustomCarousel images={post.images.map((image) => image.uri)} />
					</figure>
				{/if}
			{/if}
			<pre class="mt-2 text-sm whitespace-pre-wrap">{post.content}</pre>
		{:else if post.images?.length > 0}
			{#if is_video(post.images[0].uri)}
				<figure class="mt-2">
					<video
						src={post.images[0].uri}
						controls
						class="w-full rounded-lg"
						style="max-height: 320px;"
					>
						<track kind="captions" label="No captions" />
					</video>
				</figure>
			{:else}
				<figure class="mt-2">
					<CustomCarousel images={post.images.map((image) => image.uri)} />
				</figure>
			{/if}
		{:else}
			<a href={`/@${post.users.handle}/post/${post.id}`}>
				<pre
					class="mt-2 line-clamp-6 overflow-hidden text-sm whitespace-pre-wrap">{post.content}</pre>
			</a>
		{/if}

		{#if post.community_id}
			<a
				href={`/community/${post.communities.slug}`}
				class="mt-2 inline-block rounded bg-gray-100 px-2 py-1 text-[11px]"
			>
				{post.communities.title}
			</a>
		{/if}
	</div>

	<!-- 액션 버튼 -->
	<div class="mt-3 flex items-center justify-between text-sm text-gray-400">
		<div class="flex">
			<button
				class="mr-3 flex items-center gap-1"
				onclick={() => {
					if (!check_login()) return;

					on_vote(1);
				}}
			>
				{#if user_vote === 1}
					<RiThumbUpFill size={16} color={colors.primary} />
				{:else}
					<RiThumbUpLine size={16} color={colors.gray[400]} />
				{/if}
				<p>{like_count}</p>
			</button>

			<button
				class="mr-4 flex items-center gap-1"
				onclick={() => {
					if (!check_login()) return;

					on_vote(-1);
				}}
			>
				{#if user_vote === -1}
					<RiThumbDownFill size={16} color={colors.warning} />
				{:else}
					<RiThumbDownLine size={16} color={colors.gray[400]} />
				{/if}
			</button>

			<a
				href={`/@${post.users.handle}/post/${post.id}`}
				class="mr-4 flex items-center gap-1"
			>
				<Icon attribute="chat_bubble" size={16} color={colors.gray[400]} />

				<p>{post.post_comments?.[0]?.count ?? 0}</p>
			</a>

			<button
				class="flex items-center gap-1"
				onclick={() => {
					if (!check_login()) return;

					modal.gift = true;
				}}
			>
				<Icon attribute="gift" size={16} color={colors.gray[400]} />
				<!-- <p>10</p> -->
			</button>
		</div>

		<!-- <button class="flex items-center gap-1">
				<Icon attribute="gift" size={16} color={colors.gray[400]} />
				<p>10</p>
			</button> -->

		<button class="flex items-center gap-1" onclick={toggle_bookmark}>
			{#if is_bookmarked}
				<RiBookmarkFill size={16} color={colors.primary} />
			{:else}
				<RiBookmarkLine size={16} color={colors.gray[400]} />
			{/if}
		</button>
	</div>
</article>
<hr class="mt-2 border-gray-300" />

<Modal bind:is_modal_open={modal.post_config} modal_position="bottom">
	<div class="flex flex-col items-center bg-gray-100 p-4 text-sm font-medium">
		{#if post.users.id === $user_store.id}
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
						`${window.location.origin}/@${post.users.handle}/post/${post.id}`,
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
						`${window.location.origin}/@${post.users.handle}/post/${post.id}`,
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

<GiftModal
	bind:is_modal_open={modal.gift}
	receiver_id={post.users.id}
	receiver_name={post.users.name}
	post_id={post.id}
	on:gift_success={handle_gift_success}
/>
