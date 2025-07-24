<script>
	import { create_api } from '$lib/supabase/api';
	import { onMount } from 'svelte';

	import Login_prompt_modal from '$lib/components/ui/Login_prompt_modal/+page.svelte';
	import PerformanceMonitor from '$lib/components/ui/PerformanceMonitor/+page.svelte';

	import { api_store, update_api_store } from '$lib/store/api_store';
	import { loading } from '$lib/store/global_store';
	import { is_login_prompt_modal } from '$lib/store/global_store.js';
	import { update_user_store } from '$lib/store/user_store';

	let { data, children } = $props();
	let { supabase, session } = $derived(data);

	let is_initialized = $state(false);
	let is_hydrated = $state(false);

	onMount(async () => {
		// Initialize API store immediately
		update_api_store({
			...create_api(supabase),
		});

		// Mark as initialized for immediate render
		is_initialized = true;

		// Progressive hydration - handle authentication in background
		requestIdleCallback(async () => {
			if (session?.user?.id === undefined) {
				await update_user_store({ handle: '비회원' });
			} else {
				try {
					const user = await $api_store.users.select(session.user.id);
					if (user.handle !== null) {
						await update_user_store(user);
						// Load user data in background
						Promise.all([
							$api_store.user_follows.select_user_follows(user.id),
							$api_store.user_follows.select_user_followers(user.id),
						]).then(([user_follows, user_followers]) => {
							update_user_store({ user_follows, user_followers });
						});
					}
				} catch (error) {
					console.error('User data loading error:', error);
					await update_user_store({ handle: '비회원' });
				}
			}
			is_hydrated = true;
		});
	});
</script>

<PerformanceMonitor />

{#if is_initialized}
	<div class="mx-auto max-w-screen-md">
		{@render children()}
	</div>
{/if}

{#if $loading}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/10">
		<div
			class="border-primary h-12 w-8 animate-spin rounded-full border-t-2 border-b-2"
		></div>
	</div>
{/if}

<Login_prompt_modal bind:is_modal_open={$is_login_prompt_modal} />
