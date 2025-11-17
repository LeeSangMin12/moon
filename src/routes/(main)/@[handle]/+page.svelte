<script>
	import profile_png from '$lib/img/common/user/profile.png';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { smartGoBack } from '$lib/utils/navigation';
	import {
		RiArrowLeftSLine,
		RiHeartFill,
		RiRemixiconFill,
		RiShareLine,
	} from 'svelte-remixicon';

	import Bottom_nav from '$lib/components/ui/Bottom_nav.svelte';
	import Header from '$lib/components/ui/Header.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import TabSelector from '$lib/components/ui/TabSelector.svelte';
	import Post from '$lib/components/Post.svelte';
	import UserCard from '$lib/components/Profile/UserCard.svelte';
	import Service from '$lib/components/Service.svelte';
	import CoffeeChatModal from '$lib/components/CoffeeChatModal.svelte';

	import colors from '$lib/config/colors';
	import { check_login, copy_to_clipboard, show_toast } from '$lib/utils/common';
	import { get_user_context, get_api_context } from '$lib/contexts/app_context.svelte.js';
	import { update_global_store } from '$lib/store/global_store.js';
	import { create_post_handlers } from '$lib/composables/use_post_handlers.svelte.js';
	import { optimize_avatar } from '$lib/utils/image';

	const TITLE = '문';

	const REPORT_REASONS = [
		'스팸/광고성 유저입니다.',
		'욕설/혐오 발언을 사용했습니다.',
		'선정적인 내용을 포함하고 있습니다.',
		'잘못된 정보를 포함하고 있습니다.',
		'기타',
	];

	const me = get_user_context();
	const api = get_api_context();

	let { data } = $props();

	// 서버에서 받은 데이터 - $derived로 직접 사용
	let user = $derived(data.user);
	let posts = $derived(data.posts);

	// 클라이언트에서 로드하는 데이터
	let follower_count = $state(0);
	let following_count = $state(0);

	// user.id 변경 시에만 팔로우 카운트 로드 (적절한 $effect 사용)
	$effect(() => {
		if (!user?.id || !api?.user_follows) return;
		load_follow_counts(user.id);
	});

	const load_follow_counts = async (userId) => {
		if (!api?.user_follows) return;
		try {
			const [follower, following] = await Promise.all([
				api.user_follows.get_follower_count(userId),
				api.user_follows.get_following_count(userId),
			]);
			follower_count = follower;
			following_count = following;
		} catch (error) {
			console.error('Failed to load follow counts:', error);
		}
	};

	let tabs = ['게시글', '댓글', '서비스', '받은리뷰'];
	let selected = $state(0);
	let is_tab_loading = $state(false);

	// 각 탭별 데이터를 개별 state로 관리
	let tab_posts = $state([]);
	let tab_post_comments = $state([]);
	let tab_services = $state([]);
	let tab_service_likes = $state([]);
	let tab_service_reviews = $state([]);
	let tab_expert_request_reviews = $state([]);

	// selected_data는 $derived로 계산
	let selected_data = $derived({
		posts: tab_posts,
		post_comments: tab_post_comments,
		services: tab_services,
		service_likes: tab_service_likes,
		service_reviews: tab_service_reviews,
		expert_request_reviews: tab_expert_request_reviews,
	});

	// posts가 로드되면 tab_posts 초기화
	$effect(() => {
		if (posts && posts.length > 0) {
			tab_posts = posts;
		}
	});

	let is_following = $state(false);

	let user_report_form_data = $state({
		reason: '',
		details: '',
	});

	let modal = $state({
		user_config: false,
		report: false,
		coffee_chat: false,
	});

	let is_follow_modal_open = $state(false);
	let follow_modal_type = $state('followers'); // 'followers' or 'followings'
	let follow_modal_users = $state([]);

	onMount(async () => {
		if (me?.id) {
			is_following = await api.user_follows.is_following(
				me.id,
				user.id,
			);
		}
	});

	const toggle_follow = async () => {
		if (!check_login(me)) return;

		if (is_following) {
			await api.user_follows.unfollow(me.id, user.id);
			me.user_follows = me.user_follows.filter(
				(follow) => follow.following_id !== user.id,
			);
			// 팔로워 수 감소
			follower_count--;
		} else {
			await api.user_follows.follow(me.id, user.id);
			me.user_follows.push({
				following_id: user.id,
			});
			// 팔로워 수 증가
			follower_count++;

			// 앱 레벨 알림 생성: 팔로우 당한 사용자에게
			try {
				await api.notifications.insert({
					recipient_id: user.id,
					actor_id: me.id,
					type: 'follow.created',
					resource_type: 'user',
					resource_id: String(me.id),
					payload: {
						follower_id: me.id,
						follower_handle: me.handle,
					},
					link_url: `/@${me.handle}`,
				});
			} catch (e) {
				console.error('Failed to insert notification (follow.created):', e);
			}
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
			await api.user_reports.insert({
				reporter_id: me.id,
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

	/**
	 * 게시물에 사용자 상호작용 데이터 추가
	 * 성능 최적화: 특정 게시물의 votes/bookmarks만 조회 (데이터 전송량 90-99% 감소)
	 * @param {Array} post_list - 게시물 배열
	 * @returns {Promise<Array>} votes/bookmarks가 포함된 게시물 배열
	 */
	const attach_user_interactions = async (post_list) => {
		if (!me?.id || post_list.length === 0) {
			return post_list;
		}

		try {
			const post_ids = post_list.map((p) => p.id);

			// 특정 게시물의 votes/bookmarks만 조회 (최적화!)
			const [votes, bookmarks] = await Promise.all([
				api.post_votes.select_by_post_ids(me.id, post_ids),
				api.post_bookmarks.select_by_post_ids(me.id, post_ids),
			]);

			return post_list.map((post) => ({
				...post,
				post_votes: votes.filter((v) => v.post_id === post.id),
				post_bookmarks: bookmarks.filter((b) => b.post_id === post.id),
			}));
		} catch (error) {
			console.error('Failed to attach user interactions:', error);
			return post_list;
		}
	};

	const load_tab_data = async (tab_index) => {
		if (!api?.posts) return;

		is_tab_loading = true;
		try {
			if (tab_index === 0) {
				// 게시글 탭 - 이미 로드된 데이터가 있으면 재사용 (중복 쿼리 방지)
				if (tab_posts.length > 0) return;
				const loaded_posts = await api.posts.select_by_user_id(user.id);
				tab_posts = await attach_user_interactions(loaded_posts);
			} else if (tab_index === 1) {
				// 댓글 탭
				tab_post_comments = await api.post_comments.select_by_user_id(user.id);
			} else if (tab_index === 2) {
				// 서비스 탭
				tab_services = await api.services.select_by_user_id(user.id);
				tab_service_likes = await api.service_likes.select_by_user_id(user.id);
			} else if (tab_index === 3) {
				// 받은리뷰 탭 - 서비스 리뷰와 전문가 리뷰 모두 조회
				const [service_reviews, expert_reviews] = await Promise.all([
					api.service_reviews.select_by_service_author_id(user.id),
					api.expert_request_reviews.select_by_expert_id(user.id),
				]);
				tab_service_reviews = service_reviews;
				tab_expert_request_reviews = expert_reviews;
			}
		} finally {
			is_tab_loading = false;
		}
	};

	// 탭 변경 시 데이터 로드
	$effect(() => {
		if (!api?.posts) return;
		load_tab_data(selected);
	});

	const handle_gift_comment_added = async ({ gift_content, gift_moon_point, parent_comment_id, post_id }) => {
		// 실제 댓글 추가 (메인 페이지에서는 UI에 표시되지 않지만 DB에는 저장됨)
		await api.post_comments.insert({
			post_id,
			user_id: me.id,
			content: gift_content,
			parent_comment_id,
			gift_moon_point,
		});
	};

	// Post 이벤트 핸들러 (composable 사용)
	const { handle_bookmark_changed, handle_vote_changed } = create_post_handlers(
		() => tab_posts,
		(updated_posts) => {
			tab_posts = updated_posts;
		},
		me
	);

	// Service 좋아요 변경 핸들러
	const handle_service_like_changed = ({ service_id, likes }) => {
		tab_service_likes = likes;
	};

	const open_follow_modal = async (type) => {
		follow_modal_type = type;
		is_follow_modal_open = true;
		if (type === 'followers') {
			follow_modal_users = await api.user_follows.select_followers(
				user.id,
			);
		} else {
			follow_modal_users = await api.user_follows.select_followings(
				user.id,
			);
		}
	};

	// params 변경 시 탭 데이터와 팔로우 상태를 다시 로드
	// (load 함수가 user/posts/counts는 자동으로 처리함)
	let prev_user_id = $state(null);
	$effect(() => {
		// user id가 실제로 변경되었을 때만 실행
		if (user?.id && user.id !== prev_user_id) {
			prev_user_id = user.id;

			// 탭을 게시글로 리셋하고 데이터 로드
			selected = 0;
			load_tab_data(0);

			// 팔로우 상태 업데이트
			if (me?.id) {
				api.user_follows.is_following(me.id, user.id).then(result => {
					is_following = result;
				});
			}

			// 모달 닫기
			is_follow_modal_open = false;
		}
	});
</script>

<svelte:head>
	<title>{user?.name || '사용자'}의 프로필 | 문</title>
	<meta
		name="description"
		content={user?.self_introduction ||
			`${user?.name || '사용자'}의 프로필입니다. 게시글, 댓글, 서비스, 리뷰를 확인하고 팔로우하세요.`}
	/>

	<!-- Open Graph / Facebook -->
	<meta property="og:type" content="profile" />
	<meta
		property="og:url"
		content={typeof window !== 'undefined' ? window.location.href : ''}
	/>
	<meta property="og:title" content="{user?.name || '사용자'}의" 프로필 />
	<meta
		property="og:description"
		content={user?.self_introduction ||
			`${user?.name || '사용자'}의 프로필입니다. 게시글, 댓글, 서비스, 리뷰를 확인하고 팔로우하세요.`}
	/>
	<meta property="og:image" content={user?.avatar_url || profile_png} />
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />

	<!-- Twitter -->
	<meta property="twitter:card" content="summary_large_image" />
	<meta
		property="twitter:url"
		content={typeof window !== 'undefined' ? window.location.href : ''}
	/>
	<meta property="twitter:title" content="{user?.name || '사용자'}의" 프로필 />
	<meta
		property="twitter:description"
		content={user?.self_introduction ||
			`${user?.name || '사용자'}의 프로필입니다. 게시글, 댓글, 서비스, 리뷰를 확인하고 팔로우하세요.`}
	/>
	<meta property="twitter:image" content={user?.avatar_url || profile_png} />
</svelte:head>

<Header>
	<div slot="left">
		{#if $page.params.handle !== me?.handle}
			<button
				class="flex items-center"
				onclick={smartGoBack}
				aria-label="이전 페이지로 돌아가기"
			>
				<RiArrowLeftSLine size={28} color={colors.gray[600]} />
			</button>
		{/if}
	</div>

	<div slot="right">
		<button
			class="flex items-center"
			onclick={() => {
				if (!check_login(me)) return;

				if ($page.params.handle !== me?.handle) {
					modal.user_config = true;
				} else {
					goto(`/@${me?.handle}/accounts`);
				}
			}}
			aria-label={$page.params.handle !== me?.handle ? '사용자 메뉴 열기' : '계정 설정 열기'}
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
					src={optimize_avatar(user?.avatar_url) || profile_png}
					alt="{user?.name || '사용자'}님의 프로필 사진"
					class="block aspect-square h-14 w-14 rounded-full object-cover"
					loading="eager"
					width="56"
					height="56"
				/>
			</div>
			<!-- 프로필 정보 -->
			<div class="flex-1">
				<h2 class="text-sm text-gray-500">@{user?.handle ?? 'loading...'}</h2>
				<h1 class="mt-1 text-lg font-semibold">{user?.name ?? 'Loading...'}</h1>
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
				class="cursor-pointer min-h-[44px] py-2"
				onclick={() => open_follow_modal('followers')}
				aria-label="{follower_count}명의 팔로워 보기"
			>
				<span class="font-medium">{follower_count}</span>
				<span class="text-sm text-gray-500"> 팔로워</span>
			</button>
			<button
				class="cursor-pointer min-h-[44px] py-2"
				onclick={() => open_follow_modal('followings')}
				aria-label="{following_count}명의 팔로잉 보기"
			>
				<span class="font-medium">{following_count}</span>
				<span class="text-sm text-gray-500"> 팔로잉</span>
			</button>
		</div>

		<!-- 소개글 -->
		<p class="mt-4 text-sm whitespace-pre-wrap">
			{user?.self_introduction || ''}
		</p>

		{#if $page.params.handle === me?.handle}
			<!-- 메시지와 팔로우 버튼 -->
			<div class="mt-4 flex space-x-2">
				<button
					onclick={() => user?.handle && goto(`/@${user.handle}/accounts/profile/modify`)}
					class="btn flex h-9 flex-1 items-center justify-center border-none bg-gray-100"
					aria-label="프로필 편집 페이지로 이동"
				>
					프로필 편집
				</button>
				<button
					onclick={() => {
						copy_to_clipboard(
							`${window.location.origin}/@${user?.handle || ''}`,
							'링크가 복사되었습니다.',
						);
					}}
					class="btn flex h-9 flex-1 items-center justify-center border-none bg-gray-100"
					aria-label="프로필 링크 복사하기"
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
						aria-label="{user?.name}님 팔로우 취소"
					>
						팔로잉
					</button>
				{:else}
					<button
						class="btn btn-primary flex h-9 flex-1 items-center justify-center"
						onclick={toggle_follow}
						aria-label="{user?.name}님 팔로우하기"
					>
						팔로우
					</button>
				{/if}
				<button
					onclick={() => {
						if (!check_login(me)) return;
						modal.coffee_chat = true;
					}}
					class="btn flex h-9 flex-1 items-center justify-center border-none bg-gray-100"
					aria-label="{user?.name}님에게 커피챗 신청하기"
				>
					커피챗
				</button>
				<button
					onclick={() => {
						copy_to_clipboard(
							`${window.location.origin}/@${user?.handle || ''}`,
							'링크가 복사되었습니다.',
						);
					}}
					class="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 min-w-[44px] min-h-[44px]"
					aria-label="프로필 링크 공유하기"
				>
					<RiShareLine />
				</button>
			</div>
		{/if}
	</section>

	<div class="mt-6">
		<TabSelector {tabs} bind:selected />
	</div>

	{#if is_tab_loading}
		<div class="flex justify-center py-12">
			<span class="loading loading-spinner loading-lg text-primary"></span>
		</div>
	{:else if selected === 0 && selected_data.posts.length > 0}
		{#each selected_data.posts as post}
			<div class="mt-4">
				<Post
				{post}
				onGiftCommentAdded={handle_gift_comment_added}
				onBookmarkChanged={handle_bookmark_changed}
				onVoteChanged={handle_vote_changed}
			/>
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
							<!-- <p class="mb-1 text-xs text-gray-500">댓글을 남긴 게시글</p> -->
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
									aria-label="원본 게시글 보기"
								>
									게시글 보기 →
								</button>
							{/if}
						</div>
					{/if}

					<!-- 댓글 내용 -->
					<div class="flex items-start space-x-3">
						<img
							src={optimize_avatar(user.avatar_url) || profile_png}
							alt="{user.name}님의 프로필 사진"
							class="h-8 w-8 rounded-full"
							loading="lazy"
							width="32"
							height="32"
						/>
						<div class="flex-1">
							<div class="flex items-center space-x-2">
								<p class="text-sm font-medium">@{user?.handle ?? 'unknown'}</p>
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
										{comment.gift_moon_point} 문 선물
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
			{#each selected_data.services as service (service.id)}
				<Service {service} service_likes={selected_data.service_likes} onLikeChanged={handle_service_like_changed} />
			{/each}
		</div>
	{:else if selected === 3 && (selected_data.service_reviews.length > 0 || selected_data.expert_request_reviews.length > 0)}
		<!-- 받은리뷰 탭 -->
		<div class="mx-4 mt-4 space-y-3">
			<!-- 전문가 요청 리뷰 -->
			{#each selected_data.expert_request_reviews as review}
				<div class="rounded-lg border border-gray-200 bg-white p-4">
					<!-- 리뷰받은 전문가 요청 정보 -->
					{#if review.request}
						<div class="mb-3 rounded bg-emerald-50 p-3">
							<p class="mb-1 text-xs text-emerald-700">전문가 요청 리뷰</p>
							<p class="text-sm font-medium text-gray-900">
								{review.request.title || '제목 없음'}
							</p>
							<button
								onclick={() => goto(`/expert-request/${review.request.id}`)}
								class="mt-1 text-xs text-emerald-600 hover:underline"
								aria-label="전문가 요청 상세보기"
							>
								요청 보기 →
							</button>
						</div>
					{/if}

					<!-- 리뷰 내용 -->
					<div class="flex items-start space-x-3">
						{#if review.reviewer?.avatar_url}
							<img
								src={optimize_avatar(review.reviewer.avatar_url)}
								alt="{review.reviewer.name || '익명 사용자'}님의 프로필 사진"
								class="h-8 w-8 rounded-full"
								loading="lazy"
								width="32"
								height="32"
							/>
						{:else}
							<img
								src={profile_png}
								alt="익명 사용자의 기본 프로필 사진"
								class="h-8 w-8 rounded-full"
								loading="lazy"
								width="32"
								height="32"
							/>
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

			<!-- 서비스 리뷰 -->
			{#each selected_data.service_reviews as review}
				<div class="rounded-lg border border-gray-200 bg-white p-4">
					<!-- 리뷰받은 서비스 정보 -->
					{#if review.service}
						<div class="mb-3 rounded bg-blue-50 p-3">
							<p class="mb-1 text-xs text-blue-700">서비스 리뷰</p>
							<p class="text-sm font-medium text-gray-900">
								{review.service.title || '제목 없음'}
							</p>
							<button
								onclick={() => goto(`/service/${review.service.id}`)}
								class="mt-1 text-xs text-blue-600 hover:underline"
								aria-label="서비스 상세보기"
							>
								서비스 보기 →
							</button>
						</div>
					{/if}

					<!-- 리뷰 내용 -->
					<div class="flex items-start space-x-3">
						{#if review.reviewer?.avatar_url}
							<img
								src={optimize_avatar(review.reviewer.avatar_url)}
								alt="{review.reviewer.name || '익명 사용자'}님의 프로필 사진"
								class="h-8 w-8 rounded-full"
								loading="lazy"
								width="32"
								height="32"
							/>
						{:else}
							<img
								src={profile_png}
								alt="익명 사용자의 기본 프로필 사진"
								class="h-8 w-8 rounded-full"
								loading="lazy"
								width="32"
								height="32"
							/>
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

{#if $page.params.handle === me?.handle}
	<Bottom_nav />
{/if}

<Modal bind:is_modal_open={modal.user_config} modal_position="bottom">
	<div class="flex flex-col items-center bg-gray-100 p-4 text-sm font-medium">
		<button
			onclick={() => (modal.report = true)}
			class="flex w-full flex-col items-center rounded-lg bg-white"
			aria-label="사용자 신고하기"
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
			aria-label="신고 취소"
		>
			취소
		</button>
		<button
			onclick={handle_report_submit}
			class="btn btn-primary w-2/3 rounded-none"
			aria-label="신고 제출하기"
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

<!-- 커피챗 모달 -->
<CoffeeChatModal bind:isOpen={modal.coffee_chat} recipientUser={user} />
