<script>
	import { RiHeartFill, RiStarFill } from 'svelte-remixicon';

	import Icon from '$lib/components/ui/Icon.svelte';
	import StarRating from '$lib/components/ui/StarRating.svelte';

	import colors from '$lib/config/colors';
	import { check_login, comma, show_toast } from '$lib/utils/common';
	import { get_user_context, get_api_context } from '$lib/contexts/app-context.svelte.js';

	const { me } = get_user_context();
	const { api } = get_api_context();

	let { service = [], service_likes = [], onLikeChanged } = $props();

	// 로컬 상태: 좋아요 여부와 로딩 상태
	let is_liked = $state(false);
	let is_loading = $state(false);

	// service_likes를 Set으로 변환하여 O(1) 조회
	let liked_service_ids = $derived(new Set(service_likes.map((s) => s.service_id)));

	// props 변경 시 로컬 상태 동기화
	$effect(() => {
		is_liked = liked_service_ids.has(service.id);
	});

	const handle_like = async (service_id) => {
		if (!check_login(me) || is_loading) return;

		// 낙관적 업데이트: UI를 즉시 변경
		is_liked = true;
		is_loading = true;

		try {
			await api.service_likes.insert(service_id, me.id);
			show_toast('success', '서비스 좋아요를 눌렀어요!');

			// 부모 컴포넌트에 알림
			const updated_likes = [...service_likes, { service_id }];
			onLikeChanged?.({ service_id, likes: updated_likes });
		} catch (error) {
			// 실패 시 롤백
			is_liked = false;
			console.error('Failed to like service:', error);
			show_toast('error', '좋아요 처리에 실패했어요.');
		} finally {
			is_loading = false;
		}
	};

	const handle_unlike = async (service_id) => {
		if (!check_login(me) || is_loading) return;

		// 낙관적 업데이트: UI를 즉시 변경
		is_liked = false;
		is_loading = true;

		try {
			await api.service_likes.delete(service_id, me.id);
			show_toast('success', '서비스 좋아요를 취소했어요!');

			// 부모 컴포넌트에 알림
			const updated_likes = service_likes.filter((s) => s.service_id !== service_id);
			onLikeChanged?.({ service_id, likes: updated_likes });
		} catch (error) {
			// 실패 시 롤백
			is_liked = true;
			console.error('Failed to unlike service:', error);
			show_toast('error', '좋아요 취소에 실패했어요.');
		} finally {
			is_loading = false;
		}
	};
</script>

<div
	class="overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm"
>
	<a href={`/service/${service.id}`} class="relative block">
		<div class="relative aspect-[4/3] w-full overflow-hidden">
			<img
				src={service.images[0].uri ||
					'https://img.daisyui.com/images/stock/photo-1625726411847-8cbb60cc71e6.webp'}
				alt={service.title}
				class="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
				loading="lazy"
			/>
		</div>
	</a>
	<div class="px-2 py-2">
		<h3 class="line-clamp-2 text-sm/5 font-medium tracking-tight">
			{service.title}
		</h3>

		<div class="mt-1 flex items-center">
			<RiStarFill size={12} color={colors.primary} />
			<span class="ml-0.5 text-xs text-gray-500">
				{service.rating || 0}
			</span>

			<span class="ml-1 text-xs text-gray-500">
				({service.rating_count || 0})
			</span>
		</div>

		<div class="mt-1.5 flex items-center justify-between">
			<span class="font-semibold text-gray-900">
				₩{comma(service.price)}
			</span>

			{#if is_liked}
				<button onclick={() => handle_unlike(service.id)} disabled={is_loading}>
					<RiHeartFill size={18} color={colors.warning} />
				</button>
			{:else}
				<button onclick={() => handle_like(service.id)} disabled={is_loading}>
					<RiHeartFill size={18} color={colors.gray[400]} />
				</button>
			{/if}
		</div>
	</div>
</div>
