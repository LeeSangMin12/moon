<script>
	import { RiHeartFill, RiStarFill } from 'svelte-remixicon';

	import colors from '$lib/js/colors';
	import { comma, show_toast } from '$lib/js/common';
	import { api_store } from '$lib/store/api_store';
	import { user_store } from '$lib/store/user_store';

	let { service = [], service_likes = [] } = $props();

	const is_user_like = (service) => {
		return service_likes.some((like) => like.service_id === service.id);
	};

	const handle_like = async (service_id) => {
		try {
			await $api_store.service_likes.insert(service_id, $user_store.id);
			service_likes.push({ service_id, user_id: $user_store.id });
			show_toast('success', '서비스를 좋아요했어요!');
		} catch (error) {
			console.error(error);
		}
	};

	const handle_unlike = async (service_id) => {
		try {
			await $api_store.service_likes.delete(service_id, $user_store.id);
			service_likes = service_likes.filter(
				(like) => like.service_id !== service_id,
			);
			show_toast('success', '서비스 좋아요를 취소했어요!');
		} catch (error) {
			console.error(error);
		}
	};
</script>

<a
	href={`/expert/${service.id}`}
	class="overflow-hidden rounded-lg border border-gray-100 bg-white shadow-sm"
>
	<div class="relative">
		<img
			src={service.images[0].uri ||
				'https://img.daisyui.com/images/stock/photo-1625726411847-8cbb60cc71e6.webp'}
			alt={service.title}
			class="h-28 w-full object-cover"
		/>
	</div>
	<div class="px-2 py-2">
		<h3 class="line-clamp-2 text-sm/5 font-medium tracking-tight">
			{service.title}
		</h3>

		<div class="mt-1 flex items-center">
			<div class="flex items-center">
				<RiStarFill size={12} color={colors.primary} />
			</div>

			<span class="text-xs font-medium">{service.rating}</span>
			<span class="ml-1 text-xs text-gray-500">
				({service.rating_count})
			</span>
		</div>

		<div class="mt-1.5 flex items-center justify-between">
			<span class="font-semibold text-gray-900">
				₩{comma(service.price)}
			</span>

			{#if is_user_like(service)}
				<button onclick={() => handle_unlike(service.id)}>
					<RiHeartFill size={18} color={colors.gray[400]} />
				</button>
			{:else}
				<button onclick={() => handle_like(service.id)}>
					<RiHeartFill size={18} color={colors.gray[400]} />
				</button>
			{/if}
		</div>
	</div>
</a>
