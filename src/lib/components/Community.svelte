<script>
	import logo from '$lib/img/logo.png';

	import Icon from '$lib/components/ui/Icon.svelte';

	import colors from '$lib/config/colors';
	import { check_login, show_toast } from '$lib/utils/common';
	import { get_user_context, get_api_context } from '$lib/contexts/app_context.svelte.js';

	const me = get_user_context();
	const api = get_api_context();

	let { community = [], community_members = [], onMembershipChanged } = $props();

	const community_members_count = (community) => {
		return community.community_members?.[0]?.count ?? 0;
	};

	const is_user_member = (community) => {
		return community_members.some(
			(member) => member.community_id === community.id,
		);
	};
	const handle_join = async (community_id) => {
		try {
			await api.community_members.insert(community_id, me.id);
			community_members.push({ community_id, user_id: me.id });
			show_toast('success', '커뮤니티에 참여했어요!');

			// 부모 컴포넌트에 알림
			onMembershipChanged?.({ community_id, members: community_members });
		} catch (error) {
			console.error(error);
		}
	};

	const handle_leave = async (community_id) => {
		try {
			await api.community_members.delete(community_id, me.id);
			community_members = community_members.filter(
				(member) => member.community_id !== community_id,
			);
			show_toast('error', '커뮤니티 참여가 취소되었어요!');

			// 부모 컴포넌트에 알림
			onMembershipChanged?.({ community_id, members: community_members });
		} catch (error) {
			console.error(error);
		}
	};
</script>

<article class="px-4">
	<div class="flex items-start justify-between">
		<a href={`/community/${community.slug}`} class="flex">
			<img
				src={community.avatar_url || logo}
				alt="커뮤니티 아바타"
				class="mr-2 h-12 w-12 rounded-full object-cover"
				loading="lazy"
			/>
			<div class="flex flex-col justify-between">
				<p class="line-clamp-2 pr-4 font-medium">
					{community.title}
				</p>
				<p class="flex text-xs text-gray-400">
					<Icon attribute="person" size={16} color={colors.gray[400]} />
					{community_members_count(community)}
				</p>
			</div>
		</a>

		{#if is_user_member(community)}
			<button
				onclick={() => handle_leave(community.id)}
				class="btn btn-sm btn-soft h-7"
			>
				참여중
			</button>
		{:else}
			<button
				onclick={() => {
					if (!check_login(me)) return;

					handle_join(community.id);
				}}
				class="btn btn-primary btn-sm h-7"
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
