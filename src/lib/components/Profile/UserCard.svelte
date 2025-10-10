<script>
	import profile_png from '$lib/img/common/user/profile.png';
	import { goto } from '$app/navigation';

	import { get_user_context, get_api_context } from '$lib/contexts/app-context.svelte.js';

	const { me } = get_user_context();
	const { api } = get_api_context();

	const { profile } = $props();

	let is_following = $state(
		me.user_follows.some((follow) => {
			return follow.following_id === profile.id;
		}),
	);

	const toggle_follow = async () => {
		if (is_following) {
			await api.user_follows.unfollow(me.id, profile.id);
			me.user_follows = me.user_follows.filter(
				(follow) => follow.following_id !== profile.id,
			);
		} else {
			await api.user_follows.follow(me.id, profile.id);
			me.user_follows.push({
				following_id: profile.id,
			});
		}
		is_following = !is_following;
	};
</script>

<article class="my-3 flex items-center justify-between px-4">
	<a href={`/@${profile.handle}`} class="flex cursor-pointer items-center">
		<img
			src={profile.avatar_url || profile_png}
			alt={profile.handle}
			class="mr-2 block aspect-square h-8 w-8 rounded-full object-cover"
			loading="lazy"
		/>
		<div class="flex flex-col">
			<p class="pr-4 text-sm font-medium">{profile.name}</p>
			<p class="text-xs text-gray-400">@{profile.handle}</p>
		</div>
	</a>

	{#if profile.id !== me.id}
		{#if is_following}
			<button class="btn btn-sm h-6" onclick={toggle_follow}> 팔로잉 </button>
		{:else}
			<button class="btn btn-sm btn-primary h-6" onclick={toggle_follow}>
				팔로우
			</button>
		{/if}
	{/if}
</article>
<hr class="mt-2 border-gray-300" />
