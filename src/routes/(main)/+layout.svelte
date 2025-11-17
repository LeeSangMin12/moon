<script>
	import {
		create_api_context,
		create_user_context,
	} from '$lib/contexts/app_context.svelte.js';
	import { create_api } from '$lib/supabase/api';
	import { register_fcm_token } from '$lib/firebase/messaging.js';
	import { onMount } from 'svelte';

	import CouponPopup from '$lib/components/ui/CouponPopup.svelte';
	import Login_prompt_modal from '$lib/components/ui/Login_prompt_modal.svelte';

	import { is_login_prompt_modal, loading } from '$lib/store/global_store';

	let { data, children } = $props();

	let supabase = $derived(data.supabase);
	let session = $derived(data.session);

	const me = create_user_context();
	// API context 초기화 (빈 객체로 시작)
	const api = create_api_context({});

	// supabase가 변경될 때마다 API 재생성 및 업데이트
	$effect(() => {
		Object.assign(api, create_api(supabase));
	});

	/**
	 * 사용자 팔로우/팔로워 데이터를 비동기로 로드
	 * Post, UserCard 등 여러 컴포넌트에서 공통으로 사용하므로 layout에서 로드
	 *
	 * @param {string} user_id - 사용자 ID
	 * @returns {Promise<void>}
	 */
	async function load_follow_data(user_id) {
		try {
			const [user_follows, user_followers] = await Promise.all([
				api.user_follows.select_user_follows(user_id),
				api.user_follows.select_user_followers(user_id),
			]);
			Object.assign(me, { user_follows, user_followers });
		} catch (error) {
			console.error('Failed to load follow data:', error);
		}
	}

	/**
	 * 인증된 사용자의 전체 데이터를 로드
	 *
	 * @param {string} user_id - Supabase 사용자 ID
	 * @returns {Promise<void>}
	 */
	async function load_authenticated_user(user_id) {
		try {
			const user_data = await api.users.select(user_id);

			if (user_data?.handle) {
				Object.assign(me, user_data);
				load_follow_data(user_data.id);

				// 로그인 후 FCM 토큰 등록 (네이티브 앱 전용)
				register_fcm_token(api, user_data.id);
			}
		} catch (error) {
			console.error('Failed to load user data:', error);
			Object.assign(me, { handle: '비회원' });
		}
	}

	/**
	 * 사용자 인증 상태에 따라 데이터를 초기화
	 * 세션이 없으면 비회원 처리, 있으면 사용자 데이터 로드
	 *
	 * @returns {Promise<void>}
	 */
	async function initialize_user_data() {
		const user_id = session?.user?.id;

		if (!user_id) {
			Object.assign(me, { handle: '비회원' });
			return;
		}

		await load_authenticated_user(user_id);
	}

	// SSR에서도 기본 상태로 렌더링하고, 클라이언트에서 점진적으로 사용자 데이터 로드
	onMount(() => {
		// 브라우저가 유휴 상태일 때 사용자 데이터 로드 (성능 최적화)
		requestIdleCallback(() => {
			initialize_user_data();
		});
	});
</script>

<div class="mx-auto max-w-screen-md">
	{@render children()}
</div>

{#if $loading}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/10">
		<div
			class="border-primary h-12 w-8 animate-spin rounded-full border-t-2 border-b-2"
		></div>
	</div>
{/if}

<Login_prompt_modal bind:is_modal_open={$is_login_prompt_modal} />

<CouponPopup />
