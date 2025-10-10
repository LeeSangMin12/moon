<script>
	// Context 사용 (user_store, api_store 대체)
	import {
		create_api_context,
		create_user_context,
	} from '$lib/contexts/app-context.svelte.js';
	import { create_api } from '$lib/supabase/api';
	import { onMount } from 'svelte';

	import Login_prompt_modal from '$lib/components/ui/Login_prompt_modal/+page.svelte';
	import PerformanceMonitor from '$lib/components/ui/PerformanceMonitor/+page.svelte';

	// global_store는 UI 상태이므로 그대로 사용
	import { is_login_prompt_modal, loading } from '$lib/store/global_store';

	let { data, children } = $props();

	// Reactive values from data
	let supabase = $derived(data.supabase);
	let session = $derived(data.session);

	// Context 초기화
	const { me, update: update_me } = create_user_context();
	const { api, update: update_api } = create_api_context({});

	// supabase가 변경될 때마다 api 업데이트
	$effect(() => {
		update_api(create_api(supabase));
	});

	let is_initialized = $state(false);
	let is_hydrated = $state(false);

	onMount(async () => {
		// Mark as initialized for immediate render
		is_initialized = true;

		// Progressive hydration - handle authentication in background
		requestIdleCallback(async () => {
			if (session?.user?.id === undefined) {
				update_me({ handle: '비회원' });
			} else {
				try {
					const user_data = await api.users.select(session.user.id);
					if (user_data.handle !== null) {
						update_me(user_data);
						// Load user data in background
						Promise.all([
							api.user_follows.select_user_follows(user_data.id),
							api.user_follows.select_user_followers(user_data.id),
						]).then(([user_follows, user_followers]) => {
							update_me({ user_follows, user_followers });
						});
					}
				} catch (error) {
					console.error('User data loading error:', error);
					update_me({ handle: '비회원' });
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
