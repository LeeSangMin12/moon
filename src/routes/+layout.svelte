<script>
	import '../app.css';

	import { SvelteToast } from '@zerodevx/svelte-toast';
	import { invalidate } from '$app/navigation';
	import { onMount } from 'svelte';

	let { data, children } = $props();
	let { supabase, session } = $state(data);

	onMount(async () => {
		if (!supabase?.auth) return;
		const { data: authListener } = supabase.auth.onAuthStateChange(
			(event, newSession) => {
				if (newSession?.expires_at !== session?.expires_at) {
					invalidate('supabase:auth');
				}
			},
		);

		return () => authListener.subscription.unsubscribe();
	});
</script>

{@render children()}

<div class="toast-container">
	<SvelteToast />
</div>

<style>
	.toast-container {
		--toastContainerTop: auto;
		--toastContainerBottom: 4.5rem;
		--toastContainerRight: 0;
		--toastContainerLeft: 0;
		--toastWidth: 21rem;
		--toastMargin: 0.25rem auto;
		--toastMinHeight: 3.125rem;
		--toastPadding: 0 0.6rem;
		--toastBarHeight: 0;
		--toastBorderRadius: 0.5rem;
		font-size: 0.875rem;
	}
</style>
