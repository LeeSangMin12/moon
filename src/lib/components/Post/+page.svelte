<script>
	import profile_png from '$lib/img/common/user/profile.png';
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
	} from 'svelte-remixicon';

	import CustomCarousel from '$lib/components/ui/Carousel/+page.svelte';
	import GiftModal from '$lib/components/ui/GiftModal/+page.svelte';
	import Icon from '$lib/components/ui/Icon/+page.svelte';
	import Modal from '$lib/components/ui/Modal/+page.svelte';

	import colors from '$lib/js/colors';
	import { comma, format_date, show_toast } from '$lib/js/common';
	import { api_store } from '$lib/store/api_store';
	import { user_store } from '$lib/store/user_store';

	let { post } = $props();

	let like_count = $state(post.like_count ?? 0);
	let user_vote = $state(post.post_votes?.[0]?.vote ?? 0);
	let is_bookmarked = $state(post.post_bookmarks?.length > 0);

	let modal = $state({
		post_config: false,
		gift: false,
		report: false,
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
		if (is_bookmarked) {
			await $api_store.post_bookmarks.delete(post.id, $user_store.id);
		} else {
			await $api_store.post_bookmarks.insert(post.id, $user_store.id);
		}

		is_bookmarked = !is_bookmarked;
	};
</script>

<article class="px-4">
	<div class="flex items-center justify-between">
		<a href={`/@${post.users.handle}`} class="flex items-center">
			<img
				src={post.users.avatar_url ?? profile_png}
				alt={post.users.name}
				class="mr-2 h-8 w-8 rounded-full"
			/>

			<p class="pr-3 text-sm font-medium">{post.users.name}</p>
			<p class="mt-0.5 text-xs text-gray-400">{format_date(post.created_at)}</p>
		</a>
		<button onclick={() => (modal.post_config = true)}>
			<Icon attribute="ellipsis" size={20} color={colors.gray[500]} />
		</button>

		<!-- <button class="btn btn-sm btn-primary h-6">팔로우</button> -->
	</div>

	<!-- 제목 -->
	<h2 class="mt-1 line-clamp-2 font-semibold">
		{post.title}
	</h2>

	<div>
		<!-- 본문 -->
		{#if post.images?.length > 0}
			<figure class="mt-2">
				<CustomCarousel images={post.images.map((image) => image.uri)} />
			</figure>
		{:else}
			<p class="mt-2 line-clamp-4 text-sm text-gray-600">
				{post.content}
			</p>
		{/if}
		<!-- 비디오 -->
		<!-- https://github.com/sampotts/plyr?tab=readme-ov-file -->

		{#if post.community_id}
			<div class="mt-2 inline-block rounded bg-gray-100 px-2 py-1 text-[11px]">
				{post.communities.title}
			</div>
		{/if}
	</div>

	<!-- 액션 버튼 -->
	<div class="mt-3 flex items-center justify-between text-sm text-gray-400">
		<div class="flex">
			<button class="mr-3 flex items-center gap-1" onclick={() => on_vote(1)}>
				{#if user_vote === 1}
					<RiThumbUpFill size={16} color={colors.primary} />
				{:else}
					<RiThumbUpLine size={16} color={colors.gray[400]} />
				{/if}
				<p>{like_count}</p>
			</button>

			<button class="mr-4 flex items-center gap-1" onclick={() => on_vote(-1)}>
				{#if user_vote === -1}
					<RiThumbDownFill size={16} color={colors.warning} />
				{:else}
					<RiThumbDownLine size={16} color={colors.gray[400]} />
				{/if}
			</button>

			<button class="mr-4 flex items-center gap-1">
				<Icon attribute="chat_bubble" size={16} color={colors.gray[400]} />

				<p>{post.post_comments?.[0]?.count ?? 0}</p>
			</button>

			<button
				class="flex items-center gap-1"
				onclick={() => (modal.gift = true)}
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
					<p class="text-gray-400">수정하기</p>
				</a>

				<hr class=" w-full border-gray-100" />

				<div class="flex w-full items-center gap-3 p-3">
					<RiBookmarkLine size={20} color={colors.gray[400]} />
					<p class="text-gray-400">저장</p>
				</div>
			</div>

			<div class="mt-4 flex w-full flex-col items-center rounded-lg bg-white">
				<div class="flex w-full items-center gap-3 p-3">
					<div class="rotate-320">
						<Icon attribute="link" size={20} color={colors.gray[400]} />
					</div>

					<p class="text-gray-400">링크복사</p>
				</div>
			</div>

			<div class=" mt-4 flex w-full flex-col items-center rounded-lg bg-white">
				<div class="flex w-full items-center gap-3 p-3">
					<RiDeleteBinLine size={20} color={colors.warning} />
					<p class="text-red-500">삭제하기</p>
				</div>
			</div>
		{:else}
			<div class="flex w-full flex-col items-center rounded-lg bg-white">
				<div class="flex w-full items-center gap-3 p-3">
					<Icon attribute="bookmark" size={20} color={colors.gray[400]} />
					<p class="text-gray-600">저장</p>
				</div>

				<hr class=" w-full border-gray-100" />

				<div class="flex w-full items-center gap-3 p-3">
					<Icon attribute="add_circle" size={20} color={colors.gray[400]} />
					<p class="text-gray-600">팔로우</p>
				</div>
			</div>

			<div class="mt-4 flex w-full flex-col items-center rounded-lg bg-white">
				<div class="flex w-full items-center gap-3 p-3">
					<div class="rotate-320">
						<Icon attribute="link" size={20} color={colors.gray[400]} />
					</div>

					<p class="text-gray-600">링크복사</p>
				</div>
			</div>

			<div class=" mt-4 flex w-full flex-col items-center rounded-lg bg-white">
				<div class="flex w-full items-center gap-2 p-3">
					<Icon attribute="exclamation" size={24} color={colors.warning} />
					<p class="text-red-500">신고하기</p>
				</div>
			</div>
		{/if}
	</div>
</Modal>

<!-- <GiftModal
	bind:is_modal_open={modal.gift}
	receiver_id={post.users.id}
	receiver_name={post.users.name}
	on:giftsuccess={(e) => dispatch('newgiftcomment', e.detail)}
/> -->
