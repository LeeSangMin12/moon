<script>
	import { RiHeartFill, RiStarFill } from 'svelte-remixicon';

	import Icon from '$lib/components/ui/Icon/+page.svelte';
	import StarRating from '$lib/components/ui/StarRating/+page.svelte';

	import colors from '$lib/js/colors';
	import { check_login, comma, show_toast } from '$lib/js/common';
	import { api_store } from '$lib/store/api_store';
	import { user_store } from '$lib/store/user_store';

	let { service = [], service_likes = [] } = $props();

	const handle_like = async (service_id) => {
		if (!check_login()) return;

		await $api_store.service_likes.insert(service_id, $user_store.id);
		service_likes = [...service_likes, { service_id }];
		show_toast('success', '서비스 좋아요를 눌렀어요!');
	};

	const handle_unlike = async (service_id) => {
		if (!check_login()) return;

		await $api_store.service_likes.delete(service_id, $user_store.id);
		service_likes = service_likes.filter(
			(service) => service.service_id !== service_id,
		);
		show_toast('success', '서비스 좋아요를 취소했어요!');
	};

	const is_user_liked = (service_id) => {
		return service_likes.some((service) => service.service_id === service_id);
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

			{#if is_user_liked(service.id)}
				<button onclick={() => handle_unlike(service.id)}>
					<RiHeartFill size={18} color={colors.warning} />
				</button>
			{:else}
				<button onclick={() => handle_like(service.id)}>
					<RiHeartFill size={18} color={colors.gray[400]} />
				</button>
			{/if}
		</div>
	</div>
</div>
