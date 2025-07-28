<script>
	import profile_png from '$lib/img/common/user/profile.png';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import {
		RiArrowLeftSLine,
		RiHeartFill,
		RiRemixiconFill,
		RiShareLine,
	} from 'svelte-remixicon';

	import Bottom_nav from '$lib/components/ui/Bottom_nav/+page.svelte';
	import Header from '$lib/components/ui/Header/+page.svelte';
	import Icon from '$lib/components/ui/Icon/+page.svelte';
	import Modal from '$lib/components/ui/Modal/+page.svelte';
	import TabSelector from '$lib/components/ui/TabSelector/+page.svelte';
	import Post from '$lib/components/Post/+page.svelte';
	import UserCard from '$lib/components/Profile/UserCard.svelte';
	import Service from '$lib/components/Service/+page.svelte';

	import colors from '$lib/js/colors';
	import { check_login, copy_to_clipboard, show_toast } from '$lib/js/common';
	import { api_store } from '$lib/store/api_store';
	import { update_global_store } from '$lib/store/global_store.js';
	import { user_store } from '$lib/store/user_store';

	const TITLE = '문';

	const REPORT_REASONS = [
		'스팸/광고성 유저입니다.',
		'욕설/혐오 발언을 사용했습니다.',
		'선정적인 내용을 포함하고 있습니다.',
		'잘못된 정보를 포함하고 있습니다.',
		'기타',
	];

	let { data } = $props();
	let { user, posts, follower_count, following_count } = $state(data);

	let tabs = ['게시글', '댓글', '서비스', '받은리뷰'];
	let selected = $state(0);
	let selected_data = $state({
		posts: [],
		post_comments: [],
		services: [],
		service_likes: [],
		service_reviews: [],
	});

	// posts가 변경될 때 selected_data.posts도 업데이트
	$effect(() => {
		selected_data.posts = posts || [];
	});

	let is_following = $state(false);

	let user_report_form_data = $state({
		reason: '',
		details: '',
	});

	let modal = $state({
		user_config: false,
		report: false,
	});

	let is_follow_modal_open = $state(false);
	let follow_modal_type = $state('followers'); // 'followers' or 'followings'
	let follow_modal_users = $state([]);

	onMount(async () => {
		if ($user_store?.id) {
			is_following = await $api_store.user_follows.is_following(
				$user_store.id,
				user.id,
			);
		}
	});

	const toggle_follow = async () => {
		if (!check_login()) return;

		if (is_following) {
			await $api_store.user_follows.unfollow($user_store.id, user.id);
			$user_store.user_follows = $user_store.user_follows.filter(
				(follow) => follow.following_id !== user.id,
			);
		} else {
			await $api_store.user_follows.follow($user_store.id, user.id);
			$user_store.user_follows.push({
				following_id: user.id,
			});
		}

		is_following = !is_following;
		show_toast('success', '팔로잉 상태가 변경되었습니다.');
	};

	const handle_report_submit = async () => {
		if (user_report_form_data.reason === '') {
			show_toast('error', '신고 사유를 선택해주세요.');
			return;
		}

		try {
			await $api_store.user_reports.insert({
				reporter_id: $user_store.id,
				user_id: user.id,
				reason: user_report_form_data.reason,
				details: user_report_form_data.details,
			});

			show_toast('success', '신고가 정상적으로 접수되었습니다.');
		} catch (error) {
			console.error('Failed to submit report:', error);
			show_toast('error', '신고 접수 중 오류가 발생했습니다.');
		} finally {
			modal.report = false;
			modal.user_config = false;
			user_report_form_data.reason = '';
			user_report_form_data.details = '';
		}
	};

	const load_tab_data = async (tab_index) => {
		if (tab_index === 0) {
			// 게시글 탭
			selected_data.posts = await $api_store.posts.select_by_user_id(user.id);
		} else if (tab_index === 1) {
			// 댓글 탭
			selected_data.post_comments =
				await $api_store.post_comments.select_by_user_id(user.id);
		} else if (tab_index === 2) {
			// 서비스 탭
			selected_data.services = await $api_store.services.select_by_user_id(
				user.id,
			);
			selected_data.service_likes =
				await $api_store.service_likes.select_by_user_id(user.id);
		} else if (tab_index === 3) {
			// 받은리뷰 탭
			selected_data.service_reviews =
				await $api_store.service_reviews.select_by_service_author_id(user.id);
		}
	};

	// 탭 변경 시 데이터 로드
	$effect(() => {
		load_tab_data(selected);
	});

	const handle_gift_comment_added = async (event) => {
		const { gift_content, gift_moon_point, parent_comment_id, post_id } =
			event.detail;

		// 실제 댓글 추가 (메인 페이지에서는 UI에 표시되지 않지만 DB에는 저장됨)
		await $api_store.post_comments.insert({
			post_id,
			user_id: $user_store.id,
			content: gift_content,
			parent_comment_id,
			gift_moon_point,
		});
	};

	const open_follow_modal = async (type) => {
		follow_modal_type = type;
		is_follow_modal_open = true;
		if (type === 'followers') {
			follow_modal_users = await $api_store.user_follows.select_followers(
				user.id,
			);
		} else {
			follow_modal_users = await $api_store.user_follows.select_followings(
				user.id,
			);
		}
	};

	$effect(async () => {
		const handle = $page.params.handle;
		if (!handle || !$api_store.users) return;

		const new_user = await $api_store.users.select_by_handle(handle);
		const new_posts = await $api_store.posts.select_by_user_id(new_user.id);
		const new_follower_count = await $api_store.user_follows.get_follower_count(
			new_user.id,
		);
		const new_following_count =
			await $api_store.user_follows.get_following_count(new_user.id);

		user = new_user;
		posts = new_posts;
		follower_count = new_follower_count;
		following_count = new_following_count;

		if ($user_store?.id) {
			is_following = await $api_store.user_follows.is_following(
				$user_store.id,
				new_user.id,
			);
		}

		// 탭 데이터도 새로고침
		await load_tab_data(selected);

		is_follow_modal_open = false;
	});
</script>

<svelte:head>
	<title>{user?.name || '사용자'}의 프로필 | 문</title>
	<meta
		name="description"
		content="{user?.name ||
			'사용자'}의 프로필입니다. 게시글, 댓글, 서비스, 리뷰를 확인하고 팔로우하세요."
	/>
</svelte:head>

<Header>
	<div slot="left">
		{#if $page.params.handle !== $user_store.handle}
			<button class="flex items-center" onclick={() => history.back()}>
				<RiArrowLeftSLine size={28} color={colors.gray[600]} />
			</button>
		{/if}
	</div>

	<div slot="right">
		<button
			class="flex items-center"
			onclick={() => {
				if (!check_login()) return;

				if ($page.params.handle !== $user_store.handle) {
					modal.user_config = true;
				} else {
					goto(`/@${$user_store.handle}/accounts`);
				}
			}}
		>
			<Icon attribute="menu" size={24} color={colors.gray[600]} />
		</button>
	</div>
</Header>

<main>
	<!-- 프로필 섹션 -->
	<section class="px-4">
		<div class="flex items-start">
			<!-- 프로필 이미지 -->
			<div class="mr-4">
				<img
					src={user.avatar_url || profile_png}
					alt="프로필 이미지"
					class="h-16 w-16 rounded-full border-2 border-gray-100 object-cover"
				/>
			</div>
			<!-- 프로필 정보 -->
			<div class="flex-1">
				<h2 class="text-sm text-gray-500">@{user.handle}</h2>
				<h1 class="text-xl font-bold">{user.name}</h1>
				<!-- 별점 -->
				<!-- <div class="mt-1 flex items-center">
					<div class="flex items-center text-yellow-500">
						<Icon attribute="star" size={16} color={colors.primary} />
					</div>

					<span class="text-sm font-medium">{user.rating}</span>
					<span class="ml-1 text-sm text-gray-500">
						({user.rating_count || 0})
					</span>
				</div> -->
			</div>
		</div>

		<!-- 팔로워/팔로잉 정보 -->
		<div class="mt-4 flex items-center space-x-4">
			<button
				class="cursor-pointer"
				onclick={() => open_follow_modal('followers')}
			>
				<span class="font-medium">{follower_count}</span>
				<span class="text-sm text-gray-500"> 팔로워</span>
			</button>
			<button
				class="cursor-pointer"
				onclick={() => open_follow_modal('followings')}
			>
				<span class="font-medium">{following_count}</span>
				<span class="text-sm text-gray-500"> 팔로잉</span>
			</button>
		</div>

		<!-- 소개글 -->
		<p class="mt-4 text-sm">
			{user.self_introduction}
		</p>

		{#if $page.params.handle === $user_store.handle}
			<!-- 메시지와 팔로우 버튼 -->
			<div class="mt-4 flex space-x-2">
				<button
					onclick={() => goto(`/@${user.handle}/accounts/profile/modify`)}
					class="btn flex h-9 flex-1 items-center justify-center border-none bg-gray-100"
				>
					프로필 편집
				</button>
				<button
					onclick={() => {
						copy_to_clipboard(
							`${window.location.origin}/@${user.handle}`,
							'링크가 복사되었습니다.',
						);
					}}
					class="btn flex h-9 flex-1 items-center justify-center border-none bg-gray-100"
				>
					프로필 공유
				</button>
			</div>
		{:else}
			<div class="mt-4 flex space-x-2">
				{#if is_following}
					<button
						class="btn flex h-9 flex-1 items-center justify-center"
						onclick={toggle_follow}
					>
						팔로잉
					</button>
				{:else}
					<button
						class="btn btn-primary flex h-9 flex-1 items-center justify-center"
						onclick={toggle_follow}
					>
						팔로우
					</button>
				{/if}
				<button
					onclick={() => show_toast('success', '메시지 기능은 준비중입니다.')}
					class="btn flex h-9 flex-1 items-center justify-center border-none bg-gray-100"
				>
					메시지
				</button>
				<button
					onclick={() => {
						copy_to_clipboard(
							`${window.location.origin}/@${user.handle}`,
							'링크가 복사되었습니다.',
						);
					}}
					class="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100"
				>
					<RiShareLine />
				</button>
			</div>
		{/if}
	</section>

	<div class="mt-6">
		<TabSelector {tabs} bind:selected />
	</div>
	{#if selected === 0 && selected_data.posts.length > 0}
		{#each selected_data.posts as post}
			<div class="mt-4">
				<Post {post} on:gift_comment_added={handle_gift_comment_added} />
			</div>
		{/each}
	{:else if selected === 1 && selected_data.post_comments.length > 0}
		<!-- 댓글 탭 -->
		<div class="mx-4 mt-4 space-y-3">
			{#each selected_data.post_comments as comment}
				<div class="rounded-lg border border-gray-200 bg-white p-4">
					<!-- 댓글이 달린 게시글 정보 -->
					{#if comment.post}
						<div class="mb-3 rounded bg-gray-50 p-3">
							<p class="mb-1 text-xs text-gray-500">댓글을 남긴 게시글</p>
							<p
								class="line-clamp-2 overflow-hidden text-sm font-medium text-ellipsis"
								style="display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;"
							>
								{comment.post.title || comment.post.content}
							</p>
							{#if comment.post?.users?.handle}
								<button
									onclick={() =>
										goto(
											`/@${comment.post.users.handle}/post/${comment.post.id}`,
										)}
									class="mt-1 text-xs text-blue-600 hover:underline"
								>
									게시글 보기 →
								</button>
							{/if}
						</div>
					{/if}

					<!-- 댓글 내용 -->
					<div class="flex items-start space-x-3">
						<img
							src={user.avatar_url || profile_png}
							alt={user.name}
							class="h-8 w-8 rounded-full"
						/>
						<div class="flex-1">
							<div class="flex items-center space-x-2">
								<p class="text-sm font-medium">@{user.handle}</p>
								<span class="text-xs text-gray-500">
									{new Date(comment.created_at).toLocaleDateString('ko-KR')}
								</span>
							</div>

							<!-- 부모 댓글이 있는 경우 -->
							{#if comment.parent_comment}
								<div class="mt-2 ml-4 border-l-2 border-gray-200 pl-3">
									<p class="mb-1 text-xs text-gray-500">답글:</p>
									<p class="text-sm text-gray-600">
										@{comment.parent_comment.users?.handle || 'unknown'}:
										{comment.parent_comment.content}
									</p>
								</div>
							{/if}

							<p class="mt-2 text-sm whitespace-pre-wrap">{comment.content}</p>

							<!-- 선물 포인트가 있는 경우 -->
							{#if comment.gift_moon_point > 0}
								<div
									class="mt-2 inline-flex items-center rounded-full bg-yellow-100 px-2 py-1"
								>
									<Icon attribute="gift" size={14} color={colors.warning} />
									<span class="ml-1 text-xs font-medium text-yellow-800">
										{comment.gift_moon_point} 포인트 선물
									</span>
								</div>
							{/if}
						</div>
					</div>
				</div>
			{/each}
		</div>
	{:else if selected === 2 && selected_data.services.length > 0}
		<!-- 서비스 탭 -->
		<div class="mt-4 grid grid-cols-2 gap-4 px-4">
			{#each selected_data.services as service}
				<Service {service} service_likes={selected_data.service_likes} />
			{/each}
		</div>
	{:else if selected === 3 && selected_data.service_reviews.length > 0}
		<!-- 받은리뷰 탭 -->
		<div class="mx-4 mt-4 space-y-3">
			{#each selected_data.service_reviews as review}
				<div class="rounded-lg border border-gray-200 bg-white p-4">
					<!-- 리뷰받은 서비스 정보 -->
					{#if review.service}
						<div class="mb-3 rounded bg-gray-50 p-3">
							<p class="mb-1 text-xs text-gray-500">받은 리뷰</p>
							<p class="text-sm font-medium">
								{review.service.title || '제목 없음'}
							</p>
							<button
								onclick={() => goto(`/service/${review.service.id}`)}
								class="mt-1 text-xs text-blue-600 hover:underline"
							>
								서비스 보기 →
							</button>
						</div>
					{/if}

					<!-- 리뷰 내용 -->
					<div class="flex items-start space-x-3">
						{#if review.reviewer?.avatar_url}
							<img
								src={review.reviewer.avatar_url}
								alt={review.reviewer.name || '익명'}
								class="h-8 w-8 rounded-full"
							/>
						{:else}
							<img src={profile_png} alt="익명" class="h-8 w-8 rounded-full" />
						{/if}
						<div class="flex-1">
							<div class="flex items-center justify-between">
								<div class="flex items-center space-x-2">
									{#if review.reviewer?.handle}
										<p class="text-sm font-medium">@{review.reviewer.handle}</p>
									{:else}
										<p class="text-sm font-medium">익명 사용자</p>
									{/if}
									<div class="flex items-center">
										{#each Array(5) as _, i}
											<Icon
												attribute="star"
												size={14}
												color={i < review.rating
													? colors.primary
													: colors.gray[300]}
											/>
										{/each}
									</div>
								</div>
								<span class="text-xs text-gray-500">
									{new Date(review.created_at).toLocaleDateString('ko-KR')}
								</span>
							</div>

							{#if review.title}
								<h3 class="mt-2 text-sm font-medium">{review.title}</h3>
							{/if}

							<p class="mt-1 text-sm whitespace-pre-wrap text-gray-700">
								{review.content}
							</p>
						</div>
					</div>
				</div>
			{/each}
		</div>
	{:else}
		<!-- 데이터가 없는 경우 -->
		<div class="mx-4 mt-8 text-center text-gray-500">
			{#if selected === 0}
				<p>작성한 게시글이 없습니다.</p>
			{:else if selected === 1}
				<p>작성한 댓글이 없습니다.</p>
			{:else if selected === 2}
				<p>등록한 서비스가 없습니다.</p>
			{:else if selected === 3}
				<p>받은 리뷰가 없습니다.</p>
			{/if}
		</div>
	{/if}
</main>

{#if $page.params.handle === $user_store.handle}
	<Bottom_nav />
{/if}

<Modal bind:is_modal_open={modal.user_config} modal_position="bottom">
	<div class="flex flex-col items-center bg-gray-100 p-4 text-sm font-medium">
		<button
			onclick={() => (modal.report = true)}
			class="flex w-full flex-col items-center rounded-lg bg-white"
		>
			<div class="flex w-full items-center gap-2 p-3">
				<Icon attribute="exclamation" size={24} color={colors.warning} />
				<p class="text-red-500">신고하기</p>
			</div>
		</button>
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
						bind:group={user_report_form_data.reason}
						class="radio radio-primary radio-xs"
					/>
					<span class="ml-2">{reason}</span>
				</label>
			{/each}
		</div>

		<textarea
			bind:value={user_report_form_data.details}
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

<Modal bind:is_modal_open={is_follow_modal_open} modal_position="center">
	<div class="p-4">
		<h2 class="mb-4 text-lg font-bold">
			{follow_modal_type === 'followers' ? '팔로워' : '팔로잉'}
		</h2>
		{#if follow_modal_users.length === 0}
			<p class="py-8 text-center text-gray-500">아직 유저가 없습니다.</p>
		{:else}
			{#each follow_modal_users as users}
				<UserCard profile={users.user} />
			{/each}
		{/if}
	</div>
</Modal>
