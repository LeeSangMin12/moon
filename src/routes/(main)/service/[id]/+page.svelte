<script>
	import profile_png from '$lib/img/common/user/profile.png';
	import { goto } from '$app/navigation';
	import {
		RiArrowLeftSLine,
		RiCloseLine,
		RiHeartFill,
		RiHeartLine,
		RiShareLine,
	} from 'svelte-remixicon';

	import CustomCarousel from '$lib/components/ui/Carousel/+page.svelte';
	import Header from '$lib/components/ui/Header/+page.svelte';
	import Icon from '$lib/components/ui/Icon/+page.svelte';
	import Modal from '$lib/components/ui/Modal/+page.svelte';

	import colors from '$lib/js/colors';
	import { check_login, comma, show_toast } from '$lib/js/common';
	import { api_store } from '$lib/store/api_store';
	import { user_store } from '$lib/store/user_store';

	let { data } = $props();
	let { service, service_likes } = $state(data);

	const images = [
		'https://img.daisyui.com/images/stock/photo-1625726411847-8cbb60cc71e6.webp',
		'https://img.daisyui.com/images/stock/photo-1625726411847-8cbb60cc71e6.webp',
		'https://blog.kakaocdn.net/dn/yLSQp/btsplMvT4kv/gkbSO89MwORwlkaAT5qLSk/img.jpg',
		'https://img.daisyui.com/images/stock/photo-1625726411847-8cbb60cc71e6.webp',
		'https://img.daisyui.com/images/stock/photo-1625726411847-8cbb60cc71e6.webp',
		'https://img.daisyui.com/images/stock/photo-1625726411847-8cbb60cc71e6.webp',
		'https://img.daisyui.com/images/stock/photo-1625726411847-8cbb60cc71e6.webp',
		'https://img.daisyui.com/images/stock/photo-1625726411847-8cbb60cc71e6.webp',
		'https://img.daisyui.com/images/stock/photo-1625726411847-8cbb60cc71e6.webp',
		'https://rukminim3.flixcart.com/image/850/1000/kwgpz0w0/paper/0/k/q/black-1-coloured-paper-sharma-business-original-imag94z6y4smhcz7.jpeg?q=20&crop=false',
	];

	let is_buy_modal_open = $state(false);
	let order_form_data = $state({
		depositor_name: '',
		bank: '',
		account_number: '',
		special_request: '',
	});

	const is_user_liked = (service_id) => {
		return service_likes.some((service) => service.service_id === service_id);
	};

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

	const handle_order = async () => {
		if (!check_login()) return;

		// 입력값 검증
		if (!order_form_data.depositor_name.trim()) {
			show_toast('error', '입금자명을 입력해주세요.');
			return;
		}
		if (!order_form_data.bank.trim()) {
			show_toast('error', '은행을 입력해주세요.');
			return;
		}
		if (!order_form_data.account_number.trim()) {
			show_toast('error', '계좌번호를 입력해주세요.');
			return;
		}

		try {
			const order_data = {
				buyer_id: $user_store.id,
				seller_id: service.users.id,
				service_id: service.id,
				service_title: service.title,
				quantity: 1,
				unit_price: service.price,
				total_amount: service.price,
				depositor_name: order_form_data.depositor_name.trim(),
				bank: order_form_data.bank.trim(),
				account_number: order_form_data.account_number.trim(),
				special_request: order_form_data.special_request.trim(),
			};

			await $api_store.service_orders.insert(order_data);

			show_toast(
				'success',
				'주문이 성공적으로 접수되었습니다! 결제 확인 후 서비스가 제공됩니다.',
			);
			is_buy_modal_open = false;

			// 폼 초기화
			order_form_data = {
				depositor_name: '',
				bank: '',
				account_number: '',
				special_request: '',
			};
		} catch (error) {
			console.error('주문 생성 실패:', error);
			show_toast('error', '주문 접수에 실패했습니다. 다시 시도해주세요.');
		}
	};
</script>

<Header>
	<button slot="left" onclick={() => history.back()}>
		<RiArrowLeftSLine size={24} color={colors.gray[600]} />
	</button>
	<h1 slot="center" class="font-semibold">{service.title}</h1>
</Header>

<main>
	<figure>
		<CustomCarousel images={service.images.map((image) => image.uri)} />
	</figure>

	<div class="mx-4 mt-6">
		<a href={`/@${service.users.handle}`} class="flex items-center">
			<img
				src={service.users.avatar_url || profile_png}
				alt={service.users.name}
				class="mr-2 h-8 w-8 rounded-full"
			/>
			<p class="pr-4 text-sm font-medium">@{service.users.handle}</p>
		</a>

		<div class="mt-2">
			<h1 class="text-lg font-semibold">{service.title}</h1>
		</div>

		<div class=" flex items-center">
			<div class="flex items-center text-yellow-500">
				<Icon attribute="star" size={16} color={colors.primary} />
			</div>

			<span class="text-sm font-medium">{service.rating}</span>
			<span class="ml-1 text-sm text-gray-500">({service.rating_count})</span>
		</div>

		<p class="text-primary mt-6 text-xl font-bold">
			₩{comma(service.price)}
		</p>

		<div class="mt-4">
			<div class="min-h-[184px] w-full rounded-[7px] bg-gray-50 px-5 py-4">
				<div class="text-sm whitespace-pre-wrap">
					{service.content}
				</div>
			</div>
		</div>
	</div>

	<div class="fixed bottom-0 w-full max-w-screen-md bg-white px-4 py-3.5">
		<div class="pb-safe flex space-x-2">
			<button
				class="btn btn-primary flex h-9 flex-1 items-center justify-center"
				onclick={() => (is_buy_modal_open = true)}
			>
				구매하기
			</button>
			<a
				target="_blank"
				href={service.inquiry_url}
				class="btn flex h-9 flex-1 items-center justify-center border-none bg-gray-100"
			>
				문의하기
			</a>
			{#if is_user_liked(service.id)}
				<button
					class="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100"
					onclick={() => handle_unlike(service.id)}
				>
					<RiHeartFill size={18} color={colors.warning} />
				</button>
			{:else}
				<button
					class="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100"
					onclick={() => handle_like(service.id)}
				>
					<RiHeartFill size={18} color={colors.gray[500]} />
				</button>
			{/if}
		</div>
	</div>
</main>

<Modal bind:is_modal_open={is_buy_modal_open} modal_position="center">
	<div class="p-4">
		<div class="flex justify-between">
			<h3 class="font-semibold">{service.title}구매하기</h3>
			<button onclick={() => (is_buy_modal_open = false)}>
				<RiCloseLine size={24} color={colors.gray[400]} />
			</button>
		</div>

		<div class="mt-6">
			<p class="text-sm font-medium">입금자명</p>
			<input
				bind:value={order_form_data.depositor_name}
				type="text"
				placeholder="입금자명을 입력해주세요"
				class="mt-2 w-full rounded-sm bg-gray-100 p-2 text-sm transition-all focus:outline-none"
			/>
		</div>

		<div class="mt-4">
			<p class="text-sm font-medium">은행</p>
			<input
				bind:value={order_form_data.bank}
				type="text"
				placeholder="은행명을 입력해주세요"
				class="mt-2 w-full rounded-sm bg-gray-100 p-2 text-sm transition-all focus:outline-none"
			/>
		</div>

		<div class="mt-4">
			<p class="text-sm font-medium">계좌번호</p>
			<input
				bind:value={order_form_data.account_number}
				type="text"
				placeholder="계좌번호를 입력해주세요"
				class="mt-2 w-full rounded-sm bg-gray-100 p-2 text-sm transition-all focus:outline-none"
			/>
		</div>

		<div class="mt-4">
			<p class="text-sm font-medium">특별 요청사항 (선택)</p>
			<textarea
				bind:value={order_form_data.special_request}
				placeholder="추가로 요청하실 내용이 있으면 입력해주세요"
				class="mt-2 w-full resize-none rounded-sm bg-gray-100 p-2 text-sm transition-all focus:outline-none"
				rows="3"
			></textarea>
		</div>

		<div class="my-4 h-px bg-gray-200"></div>

		<div>
			<div class="flex justify-between">
				<p class="font-semibold">총 결제 금액</p>
				<p class="text-primary text-lg font-bold">
					₩{comma(service.price)}
				</p>
			</div>
		</div>

		<div
			class="font-semibod mt-2 flex flex-col justify-center bg-gray-50 px-4 py-2 text-sm text-gray-900"
		>
			<p>
				아직은 계좌이체만 지원되고 있어요!<br />
				더 편리한 결제를 위해 다양한 수단을 준비 중이니 조금만 기다려주세요 😊
			</p>
		</div>

		<button
			onclick={handle_order}
			disabled={!order_form_data.depositor_name.trim() ||
				!order_form_data.bank.trim() ||
				!order_form_data.account_number.trim()}
			class="btn btn-primary mt-4 w-full rounded-lg disabled:cursor-not-allowed disabled:opacity-50"
		>
			주문하기
		</button>
	</div>
</Modal>
