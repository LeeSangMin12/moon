<script>
	/**
	 * Service card component
	 * @component
	 * Displays a service with image, title, rating, price, and like functionality
	 */
	import { RiHeartFill, RiStarFill } from 'svelte-remixicon';

	import colors from '$lib/config/colors';
	import { check_login, comma, show_toast } from '$lib/utils/common';
	import { get_user_context, get_api_context } from '$lib/contexts/app_context.svelte.js';

	const me = get_user_context();
	const api = get_api_context();

	/**
	 * @typedef {Object} Props
	 * @property {Object} service - Service data
	 * @property {Array} service_likes - Array of service likes
	 * @property {Function} [onLikeChanged] - Callback when like status changes
	 */
	let { service = [], service_likes = [], onLikeChanged } = $props();

	let is_loading = $state(false);

	/** @type {Set<string>} Liked service IDs for O(1) lookup */
	let liked_service_ids = $derived(new Set(service_likes.map((s) => s.service_id)));

	/** @type {boolean} Current like status */
	let is_liked = $derived(liked_service_ids.has(service.id));

	/**
	 * Toggles like status for the service
	 * Implements optimistic UI updates with rollback on error
	 * @param {string} service_id - Service ID to toggle like
	 * @param {boolean} current_status - Current like status
	 */
	const toggle_like = async (service_id, current_status) => {
		if (!check_login(me) || is_loading) return;

		is_loading = true;
		const action = current_status ? 'delete' : 'insert';
		const success_message = current_status
			? '서비스 좋아요를 취소했어요!'
			: '서비스 좋아요를 눌렀어요!';

		try {
			await api.service_likes[action](service_id, me.id);
			show_toast('success', success_message);

			const updated_likes = current_status
				? service_likes.filter((s) => s.service_id !== service_id)
				: [...service_likes, { service_id }];

			onLikeChanged?.({ service_id, likes: updated_likes });
		} catch (error) {
			console.error(`Failed to ${action} service like:`, error);
			show_toast('error', '좋아요 처리에 실패했어요.');
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
				src={service.images[0]?.uri ||
					'https://img.daisyui.com/images/stock/photo-1625726411847-8cbb60cc71e6.webp'}
				alt={service.title}
				class="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
				loading="lazy"
				decoding="async"
				width="400"
				height="300"
			/>
		</div>
	</a>
	<div class="px-2 py-2">
		<h3 class="line-clamp-2 min-h-[40px] text-sm/5 font-medium tracking-tight">
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

			<button
				onclick={() => toggle_like(service.id, is_liked)}
				disabled={is_loading}
				aria-label={is_liked ? '좋아요 취소' : '좋아요'}
			>
				<RiHeartFill
					size={18}
					color={is_liked ? colors.warning : colors.gray[400]}
				/>
			</button>
		</div>
	</div>
</div>
