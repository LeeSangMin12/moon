<script>
	import colors from '$lib/config/colors';
	import {
		get_api_context,
		get_user_context,
	} from '$lib/contexts/app_context.svelte.js';
	import logo from '$lib/img/logo.png';
	import { check_login, show_toast } from '$lib/utils/common';

	import Icon from '$lib/components/ui/Icon.svelte';

	const me = get_user_context();
	const api = get_api_context();

	/**
	 * @typedef {Object} Community
	 * @property {string} id - 커뮤니티 ID
	 * @property {string} title - 커뮤니티 제목
	 * @property {string} slug - 커뮤니티 슬러그
	 * @property {string} content - 커뮤니티 설명
	 * @property {string} [avatar_url] - 커뮤니티 아바타 URL
	 * @property {Array<{count: number}>} [community_members] - 멤버 수 정보
	 */

	/**
	 * @typedef {Object} CommunityMember
	 * @property {string} community_id - 커뮤니티 ID
	 * @property {string} user_id - 사용자 ID
	 */

	/**
	 * @type {{
	 *   community: Community,
	 *   community_members: CommunityMember[],
	 *   onMembershipChanged?: (data: { community_id: string, members: CommunityMember[] }) => void
	 * }}
	 */
	let { community, community_members = [], onMembershipChanged } = $props();

	/**
	 * 커뮤니티 멤버 수 반환
	 * @type {number}
	 */
	const members_count = $derived(community.community_members?.[0]?.count ?? 0);

	/**
	 * 현재 사용자의 커뮤니티 가입 여부
	 * @type {boolean}
	 */
	const is_member = $derived(
		community_members.some((member) => member.community_id === community.id),
	);

	/**
	 * 커뮤니티 참여 처리
	 */
	const handle_join = async () => {
		if (!check_login(me)) return;

		try {
			await api.community_members.insert(community.id, me.id);
			community_members.push({ community_id: community.id, user_id: me.id });
			show_toast('success', '커뮤니티에 참여했어요!');
			onMembershipChanged?.({
				community_id: community.id,
				members: community_members,
			});
		} catch (error) {
			console.error('Failed to join community:', error);
			show_toast('error', '참여에 실패했어요. 다시 시도해주세요.');
		}
	};

	/**
	 * 커뮤니티 탈퇴 처리
	 */
	const handle_leave = async () => {
		try {
			await api.community_members.delete(community.id, me.id);
			community_members = community_members.filter(
				(member) => member.community_id !== community.id,
			);
			show_toast('error', '커뮤니티 참여가 취소되었어요!');
			onMembershipChanged?.({
				community_id: community.id,
				members: community_members,
			});
		} catch (error) {
			console.error('Failed to leave community:', error);
			show_toast('error', '탈퇴에 실패했어요. 다시 시도해주세요.');
		}
	};
</script>

<article class="px-4">
	<div class="flex items-start justify-between">
		<a href={`/community/${community.slug}`} class="flex">
			<img
				src={community.avatar_url || logo}
				alt={`${community.title} 커뮤니티`}
				class="mr-2 h-12 w-12 rounded-full object-cover"
				loading="lazy"
				decoding="async"
			/>
			<div class="flex flex-col justify-between">
				<p class="line-clamp-2 pr-4 font-medium">
					{community.title}
				</p>
				<p class="flex text-xs text-gray-400">
					<Icon attribute="person" size={16} color={colors.gray[400]} />
					{members_count}
				</p>
			</div>
		</a>

		{#if is_member}
			<button
				onclick={handle_leave}
				class="btn btn-sm btn-soft h-7"
				aria-label={`${community.title} 커뮤니티 탈퇴`}
			>
				참여중
			</button>
		{:else}
			<button
				onclick={handle_join}
				class="btn btn-primary btn-sm h-7"
				aria-label={`${community.title} 커뮤니티 참여하기`}
			>
				참여하기
			</button>
		{/if}
	</div>

	<p class="mt-2 line-clamp-2 text-sm text-gray-800">
		{community.content}
	</p>
</article>

<hr class="my-3 border-gray-200" />
