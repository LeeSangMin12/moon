<script>
	import { onMount } from 'svelte';

	import { api_store } from '$lib/store/api_store';
	import { user_store } from '$lib/store/user_store';

	const { profile } = $props();

	let is_following = $state(
		$user_store.user_follows.some((follow) => {
			return follow.following_id === profile.id;
		}),
	);

	const toggle_follow = async () => {
		if (is_following) {
			await $api_store.user_follows.unfollow($user_store.id, profile.id);
			$user_store.user_follows = $user_store.user_follows.filter(
				(follow) => follow.following_id !== profile.id,
			);
		} else {
			await $api_store.user_follows.follow($user_store.id, profile.id);
			$user_store.user_follows.push({
				following_id: profile.id,
			});
		}
		is_following = !is_following;
	};
</script>

<article class="my-3 flex items-center justify-between px-4">
	<a href={`/@${profile.handle}`} class="flex items-center">
		<img
			src={profile.avatar_url}
			alt={profile.handle}
			class="mr-2 h-8 w-8 rounded-full"
		/>
		<div class="flex flex-col">
			<p class="pr-4 text-sm font-medium">{profile.name}</p>
			<p class="text-xs text-gray-400">@{profile.handle}</p>
		</div>
	</a>
	{#if is_following}
		<button class="btn btn-sm h-6" onclick={toggle_follow}> 팔로잉 </button>
	{:else}
		<button class="btn btn-sm btn-primary h-6" onclick={toggle_follow}>
			팔로우
		</button>
	{/if}
</article>
<hr class="mt-2 border-gray-300" />
