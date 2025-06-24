<script>
	import { create_api } from '$lib/supabase/api';
	import { onMount } from 'svelte';

	import Login_prompt_modal from '$lib/components/ui/Login_prompt_modal/+page.svelte';

	import { api_store, update_api_store } from '$lib/store/api_store';
	import { loading } from '$lib/store/global_store';
	import { is_login_prompt_modal } from '$lib/store/global_store.js';
	import { update_user_store } from '$lib/store/user_store';

	let { data, children } = $props();
	let { supabase, session } = $derived(data);

	let is_initialized = $state(false);

	onMount(async () => {
		update_api_store({
			...create_api(supabase),
		});

		if (session?.user?.id === undefined) {
			await update_user_store({ handle: '비회원' });
		} else {
			const user = await $api_store.users.select(session.user.id);
			if (user.handle !== null) {
				await update_user_store(user);
			}
		}

		is_initialized = true;
	});
</script>

{#if is_initialized}
	<div class="mx-auto max-w-screen-md">
		{@render children()}
	</div>
{/if}

{#if $loading}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/10">
		<div
			class="border-primary h-12 w-12 animate-spin rounded-full border-t-2 border-b-2"
		></div>
	</div>
{/if}

<Login_prompt_modal bind:is_modal_open={$is_login_prompt_modal} />
