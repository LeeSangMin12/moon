<script>
	/**
	 * 커뮤니티 상세 페이지
	 * @description 커뮤니티 정보와 게시물을 보여주는 페이지
	 */
	import { smartGoBack } from '$lib/utils/navigation';
	import { RiArrowLeftSLine, RiPencilLine, RiUserLine } from 'svelte-remixicon';

	import Header from '$lib/components/ui/Header.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import Post from '$lib/components/Post.svelte';
	import UserCard from '$lib/components/Profile/UserCard.svelte';
	import { optimize_avatar } from '$lib/utils/image';

	import logo from '$lib/img/logo.png';
	import colors from '$lib/config/colors';
	import { check_login, copy_to_clipboard, show_toast } from '$lib/utils/common';
	import { get_user_context, get_api_context } from '$lib/contexts/app_context.svelte.js';
	import { create_post_handlers } from '$lib/composables/use_post_handlers.svelte.js';

	const me = get_user_context();
	const api = get_api_context();

	const REPORT_REASONS = [
		'스팸/광고성 콘텐츠입니다.',
		'욕설/혐오 발언을 사용했습니다.',
		'선정적인 내용을 포함하고 있습니다.',
		'잘못된 정보를 포함하고 있습니다.',
		'기타'
	];

	let { data } = $props();

	let community = $derived(data.community);
	let community_participants = $derived(data.community_participants);
	let community_members_state = $derived(data.community_members);
	let participant_count = $derived(data.community.community_members?.[0]?.count ?? 0);

	let posts = $state(data.posts);

	let is_participants_modal_open = $state(false);
	let is_menu_modal_open = $state(false);
	let is_report_modal_open = $state(false);

	let report_reason = $state('');
	let report_details = $state('');

	/**
	 * 현재 사용자의 커뮤니티 가입 여부 확인
	 * @param {Object} community - 커뮤니티 객체
	 * @returns {boolean} 가입 여부
	 */
	const is_user_member = (community) => {
		return community_members_state.some((member) => member.community_id === community.id);
	};

	/**
	 * 커뮤니티 참여 처리
	 * @param {string} community_id - 커뮤니티 ID
	 */
	const handle_join = async (community_id) => {
		try {
			await api.community_members.insert(community_id, me.id);
			community_members_state = [...community_members_state, { community_id, user_id: me.id }];
			participant_count++;
			show_toast('success', '커뮤니티에 참여했어요!');
		} catch (error) {
			console.error('Failed to join community:', error);
			show_toast('error', '참여 중 오류가 발생했습니다.');
		}
	};

	/**
	 * 커뮤니티 탈퇴 처리
	 * @param {string} community_id - 커뮤니티 ID
	 */
	const handle_leave = async (community_id) => {
		try {
			await api.community_members.delete(community_id, me.id);
			community_members_state = community_members_state.filter(
				(member) => member.community_id !== community_id
			);
			participant_count--;
			show_toast('error', '커뮤니티 참여가 취소되었어요!');
		} catch (error) {
			console.error('Failed to leave community:', error);
			show_toast('error', '탈퇴 중 오류가 발생했습니다.');
		}
	};

	/**
	 * 커뮤니티 신고 제출 처리
	 */
	const handle_report_submit = async () => {
		if (!report_reason) {
			show_toast('error', '신고 사유를 선택해주세요.');
			return;
		}

		try {
			await api.community_reports.insert({
				reporter_id: me.id,
				community_id: community.id,
				reason: report_reason,
				details: report_details
			});

			show_toast('success', '신고가 정상적으로 접수되었습니다.');
		} catch (error) {
			console.error('Failed to submit report:', error);
			show_toast('error', '신고 접수 중 오류가 발생했습니다.');
		} finally {
			is_report_modal_open = false;
			report_reason = '';
			report_details = '';
		}
	};

	/**
	 * Gift 댓글 추가 처리
	 * @param {Object} params - Gift 댓글 파라미터
	 * @param {string} params.gift_content - Gift 메시지
	 * @param {number} params.gift_moon_point - Gift 포인트
	 * @param {string} params.parent_comment_id - 부모 댓글 ID
	 * @param {string} params.post_id - 게시물 ID
	 */
	const handle_gift_comment_added = async ({
		gift_content,
		gift_moon_point,
		parent_comment_id,
		post_id
	}) => {
		await api.post_comments.insert({
			post_id,
			user_id: me.id,
			content: gift_content,
			parent_comment_id,
			gift_moon_point
		});
	};

	const { handle_bookmark_changed, handle_vote_changed } = create_post_handlers(
		() => posts,
		(updated_posts) => (posts = updated_posts),
		me
	);
</script>

<svelte:head>
	<title>{community?.title || '커뮤니티'} | 문</title>
	<meta
		name="description"
		content={community?.content ||
			'다양한 주제와 관심사를 가진 사람들이 모여 소통하는 커뮤니티입니다.'}
	/>

	<!-- Open Graph / Facebook -->
	<meta property="og:type" content="website" />
	<meta
		property="og:url"
		content={typeof window !== 'undefined' ? window.location.href : ''}
	/>
	<meta property="og:title" content={community?.title || '커뮤니티'} />
	<meta
		property="og:description"
		content={community?.content ||
			'다양한 주제와 관심사를 가진 사람들이 모여 소통하는 커뮤니티입니다.'}
	/>
	<meta
		property="og:image"
		content={community?.avatar_url || '%sveltekit.assets%/open_graph_img.png'}
	/>
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />

	<!-- Twitter -->
	<meta property="twitter:card" content="summary_large_image" />
	<meta
		property="twitter:url"
		content={typeof window !== 'undefined' ? window.location.href : ''}
	/>
	<meta property="twitter:title" content={community?.title || '커뮤니티'} />
	<meta
		property="twitter:description"
		content={community?.content ||
			'다양한 주제와 관심사를 가진 사람들이 모여 소통하는 커뮤니티입니다.'}
	/>
	<meta
		property="twitter:image"
		content={community?.avatar_url || '%sveltekit.assets%/open_graph_img.png'}
	/>
</svelte:head>

<Header>
	<div slot="left">
		<button class="flex items-center" onclick={smartGoBack} aria-label="뒤로 가기">
			<RiArrowLeftSLine size={28} color={colors.gray[600]} />
		</button>
	</div>
	<h1 slot="center" class="text-medium">{community.title}</h1>
	<div slot="right">
		<button
			class="flex items-center"
			onclick={() => {
				if (!check_login(me)) return;
				is_menu_modal_open = true;
			}}
			aria-label="메뉴 열기"
		>
			<Icon attribute="menu" size={24} color={colors.gray[600]} />
		</button>
	</div>
</Header>

<main>
	<section class="px-4 py-4">
		<div class="flex items-start">
			<div>
				<img
					src={optimize_avatar(community.avatar_url) || logo}
					alt={`${community.title} 커뮤니티 아바타`}
					class="mr-2 block aspect-square h-14 w-14 rounded-full object-cover"
					loading="eager"
					width="56"
					height="56"
				/>
			</div>
			<div class="flex-1">
				<h2 class="font-semibold">{community.title}</h2>

				<button
					onclick={() => (is_participants_modal_open = true)}
					class="mt-1 flex items-center gap-1 text-sm text-gray-400"
					aria-label={`참여자 ${participant_count}명 보기`}
				>
					<RiUserLine size={16} color={colors.gray[400]} />
					{participant_count}
				</button>
			</div>
		</div>

		<pre class="mt-4 text-sm whitespace-pre-wrap">{community.content}</pre>

		<div class="mt-4 flex space-x-2">
			{#if is_user_member(community)}
				<button
					onclick={() => {
						if (!check_login(me)) return;
						handle_leave(community.id);
					}}
					class="btn btn-soft flex flex-1"
					aria-label={`${community.title} 커뮤니티 탈퇴`}
				>
					참여중
				</button>
			{:else}
				<button
					onclick={() => {
						if (!check_login(me)) return;
						handle_join(community.id);
					}}
					class="btn btn-primary flex flex-1"
					aria-label={`${community.title} 커뮤니티 참여하기`}
				>
					참여하기
				</button>
			{/if}

			<button
				class="btn btn-soft flex flex-1"
				onclick={() => copy_to_clipboard(window.location.href, 'URL이 복사되었어요!')}
				aria-label="커뮤니티 링크 공유"
			>
				공유하기
			</button>
		</div>
	</section>

	<hr class="my-2 border-gray-200" />

	{#each posts as post (post.id)}
		<div class="mt-4">
			<Post
				{post}
				onGiftCommentAdded={handle_gift_comment_added}
				onBookmarkChanged={handle_bookmark_changed}
				onVoteChanged={handle_vote_changed}
			/>
		</div>
	{/each}
</main>

<Modal bind:is_modal_open={is_menu_modal_open} modal_position="bottom">
	<div class="flex flex-col items-center bg-gray-100 p-4 text-sm font-medium">
		{#if community.creator_id === me.id}
			<a
				href={'/community/regi?slug=' + data.community.slug}
				class="flex w-full flex-col items-center rounded-lg bg-white"
				aria-label="커뮤니티 수정하기"
			>
				<div class="flex w-full items-center gap-3 p-3">
					<RiPencilLine size={20} color={colors.gray[600]} />
					<p class="text-gray-600">수정하기</p>
				</div>
			</a>
		{:else}
			<button
				onclick={() => (is_report_modal_open = true)}
				class="w-full rounded-lg bg-white"
				aria-label="커뮤니티 신고하기"
			>
				<div class="flex w-full items-center gap-2 p-3">
					<Icon attribute="exclamation" size={24} color={colors.warning} />
					<p class="text-red-500">신고하기</p>
				</div>
			</button>
		{/if}
	</div>
</Modal>

<Modal bind:is_modal_open={is_report_modal_open} modal_position="center">
	<div class="p-4">
		<h2 class="text-lg font-bold">무엇을 신고하시나요?</h2>
		<p class="mt-1 text-sm text-gray-500">
			커뮤니티 가이드라인에 어긋나는 내용을 알려주세요.
		</p>

		<div class="mt-4 space-y-2">
			{#each REPORT_REASONS as reason, index (index)}
				<label class="flex items-center">
					<input
						type="radio"
						name="report_reason"
						value={reason}
						bind:group={report_reason}
						class="radio radio-primary radio-xs"
					/>
					<span class="ml-2">{reason}</span>
				</label>
			{/each}
		</div>

		<textarea
			bind:value={report_details}
			class="textarea textarea-bordered focus:border-primary mt-4 w-full focus:outline-none"
			placeholder="상세 내용을 입력해주세요. (선택 사항)"
			rows="3"
		></textarea>
	</div>
	<div class="flex">
		<button
			onclick={() => (is_report_modal_open = false)}
			class="btn w-1/3 rounded-none"
			aria-label="신고 취소"
		>
			취소
		</button>
		<button
			onclick={handle_report_submit}
			class="btn btn-primary w-2/3 rounded-none"
			aria-label="신고 제출"
		>
			제출
		</button>
	</div>
</Modal>

<Modal bind:is_modal_open={is_participants_modal_open} modal_position="center">
	<div class="p-4">
		<h2 class="mb-4 text-lg font-semibold">참여자</h2>
		{#if community_participants.length === 0}
			<p class="py-8 text-center text-gray-500">아직 유저가 없습니다.</p>
		{:else}
			{#each community_participants as participant (participant.user_id)}
				<UserCard profile={participant.users} />
			{/each}
		{/if}
	</div>
</Modal>
