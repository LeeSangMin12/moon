<script>
	import logo from '$lib/img/logo.png';
	import { goto } from '$app/navigation';
	import {
		RiArrowLeftSLine,
		RiDeleteBinLine,
		RiPencilLine,
		RiUserLine,
	} from 'svelte-remixicon';

	import Header from '$lib/components/ui/Header/+page.svelte';
	import Icon from '$lib/components/ui/Icon/+page.svelte';
	import Modal from '$lib/components/ui/Modal/+page.svelte';
	import Post from '$lib/components/Post/+page.svelte';

	import colors from '$lib/js/colors';
	import { check_login, copy_to_clipboard, show_toast } from '$lib/js/common';
	import { api_store } from '$lib/store/api_store';
	import { user_store } from '$lib/store/user_store';

	const TITLE = '커뮤니티';

	const REPORT_REASONS = [
		'스팸/광고성 콘텐츠입니다.',
		'욕설/혐오 발언을 사용했습니다.',
		'선정적인 내용을 포함하고 있습니다.',
		'잘못된 정보를 포함하고 있습니다.',
		'기타',
	];

	let { data } = $props();
	let { community, community_members, posts } = $derived(data);
	let community_members_state = $state(data.community_members);

	let is_menu_modal_open = $state(false);
	let is_report_modal_open = $state(false);

	let report_reason = $state('');
	let report_details = $state('');

	const is_user_member = (community) => {
		return community_members_state.some(
			(member) => member.community_id === community.id,
		);
	};

	const handle_join = async (community_id) => {
		try {
			await $api_store.community_members.insert(community_id, $user_store.id);
			community_members_state.push({ community_id, user_id: $user_store.id });
			show_toast('success', '커뮤니티에 참여했어요!');
		} catch (error) {
			console.error(error);
		}
	};

	const handle_leave = async (community_id) => {
		try {
			await $api_store.community_members.delete(community_id, $user_store.id);
			community_members_state = community_members_state.filter(
				(member) => member.community_id !== community_id,
			);
			show_toast('error', '커뮤니티 참여가 취소되었어요!');
		} catch (error) {
			console.error(error);
		}
	};

	const handle_report_submit = async () => {
		if (report_reason === '') {
			show_toast('error', '신고 사유를 선택해주세요.');
			return;
		}

		try {
			await $api_store.community_reports.insert({
				reporter_id: $user_store.id,
				community_id: community.id,
				reason: report_reason,
				details: report_details,
			});

			show_toast('success', '신고가 정상적으로 접수되었습니다.');
			is_report_modal_open = false;
		} catch (error) {
			console.error('Failed to submit report:', error);
			show_toast('error', '신고 접수 중 오류가 발생했습니다.');
		} finally {
			is_report_modal_open = false;
			report_reason = '';
			report_details = '';
		}
	};

	// 메인 페이지에서는 댓글 시스템이 없으므로 gift 댓글 추가 이벤트를 단순히 처리
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
</script>

<Header>
	<div slot="left">
		<button class="flex items-center" onclick={() => history.back()}>
			<RiArrowLeftSLine size={28} color={colors.gray[600]} />
		</button>
	</div>
	<h1 slot="center" class="text-medium">{community.title}</h1>
	<div slot="right">
		<button
			class="flex items-center"
			onclick={() => {
				if (!check_login()) return;

				is_menu_modal_open = true;
			}}
		>
			<Icon attribute="menu" size={24} color={colors.gray[600]} />
		</button>
	</div>
</Header>

<main>
	<section class="px-4 py-4">
		<div class="flex items-start">
			<!-- 프로필 이미지 -->
			<div class="mr-4">
				<img
					src={community.avatar_url || logo}
					alt="프로필 이미지"
					class="h-16 w-16 rounded-full border-2 border-gray-100 object-cover"
				/>
			</div>
			<!-- 프로필 정보 -->
			<div class="flex-1">
				<h1 class="text-xl font-bold">{community.title}</h1>

				<p class="mt-2 flex items-center gap-1 text-gray-400">
					<RiUserLine size={18} color={colors.gray[400]} />
					{community.community_members?.[0]?.count ?? 0}
				</p>
			</div>
		</div>

		<!-- 소개글 -->
		<pre class="mt-4 text-sm whitespace-pre-wrap">
{community.content}
		</pre>

		<div class="mt-4 flex space-x-2">
			{#if is_user_member(community)}
				<button
					onclick={() => {
						if (!check_login()) return;

						handle_leave(community.id);
					}}
					class="btn btn-soft flex flex-1"
				>
					참여중
				</button>
			{:else}
				<button
					onclick={() => {
						if (!check_login()) return;

						handle_join(community.id);
					}}
					class="btn btn-primary flex flex-1"
				>
					참여하기
				</button>
			{/if}

			<button
				class="btn btn-soft flex flex-1"
				onclick={() =>
					copy_to_clipboard(window.location.href, 'URL이 복사되었어요!')}
			>
				공유하기
			</button>
		</div>
	</section>

	<hr class="my-2 border-gray-200" />

	{#each posts as post}
		<div class="mt-4">
			<Post {post} on:gift_comment_added={handle_gift_comment_added} />
		</div>
	{/each}
</main>

<Modal bind:is_modal_open={is_menu_modal_open} modal_position="bottom">
	<div class="flex flex-col items-center bg-gray-100 p-4 text-sm font-medium">
		{#if community.creator_id === $user_store.id}
			<!-- 수정하기 -->
			<a
				href={'/community/regi?slug=' + data.community.slug}
				class="flex w-full flex-col items-center rounded-lg bg-white"
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
			{#each REPORT_REASONS as reason}
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
