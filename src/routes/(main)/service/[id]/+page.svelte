<script>
	// Assets & Navigation

	// Utils & Stores
	import colors from '$lib/config/colors';
	import {
		get_api_context,
		get_user_context,
	} from '$lib/contexts/app-context.svelte.js';
	import profile_png from '$lib/img/common/user/profile.png';
	import {
		check_login,
		comma,
		copy_to_clipboard,
		show_toast,
	} from '$lib/utils/common';
	import { smartGoBack } from '$lib/utils/navigation';
	import { goto } from '$app/navigation';
	import {
		RiArrowLeftSLine,
		RiCloseLine,
		RiDeleteBinLine,
		RiHeartFill,
		RiPencilLine,
		RiStarFill,
	} from 'svelte-remixicon';

	// Components
	import CustomCarousel from '$lib/components/ui/Carousel.svelte';
	import Header from '$lib/components/ui/Header.svelte';
	import Icon from '$lib/components/ui/Icon.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';
	import StarRating from '$lib/components/ui/StarRating.svelte';

	const { me } = get_user_context();
	const { api } = get_api_context();

	// Props & Data
	let { data } = $props();
	let {
		service,
		service_likes,
		service_reviews,
		can_write_review,
		review_order_id,
		my_review,
		service_options,
	} = $state(data);

	// Modal States
	let is_options_modal_open = $state(false); // 옵션 선택 모달
	let is_review_modal_open = $state(false);
	let is_service_config_modal_open = $state(false); // 서비스 설정 모달
	let is_submitting_review = $state(false);
	let editing_review = $state(null);

	// Purchase Form Data
	let selected_options = $state([]); // 선택된 옵션 IDs
	let quantity = $state(1); // 수량

	// Form Data
	let order_form_data = $state({
		depositor_name: '',
		bank: '',
		account_number: '',
		buyer_contact: '',
		special_request: '',
	});

	let review_form_data = $state({
		rating: 0,
		title: '',
		content: '',
	});

	// Common CSS Classes
	const INPUT_CLASS =
		'mt-2 w-full rounded-sm bg-gray-100 p-2 text-sm transition-all focus:outline-none';
	const BUTTON_CLASS =
		'btn btn-primary w-full rounded-lg disabled:cursor-not-allowed disabled:opacity-50';

	// Utility Functions
	const is_user_liked = (service_id) =>
		service_likes.some((service) => service.service_id === service_id);

	// 옵션 토글
	const toggle_option = (option_id) => {
		if (selected_options.includes(option_id)) {
			selected_options = selected_options.filter((id) => id !== option_id);
		} else {
			selected_options = [...selected_options, option_id];
		}
	};

	// 총 금액 계산 (구매자는 표시가격만 지불)
	const calculate_total = $derived(() => {
		if (!service?.price) return 0;

		const base_price = service.price;
		const options_price = (service_options || [])
			.filter((opt) => selected_options.includes(opt.id))
			.reduce((sum, opt) => sum + opt.price_add, 0);

		return (base_price + options_price) * quantity;
	});

	// 수량 증가/감소
	const increase_quantity = () => {
		quantity = quantity + 1;
	};

	const decrease_quantity = () => {
		if (quantity > 1) {
			quantity = quantity - 1;
		}
	};

	// 자기 서비스인지 확인
	const is_own_service = $derived(me && service.users?.id === me.id);

	// checkout 페이지로 이동
	const proceed_to_checkout = () => {
		if (!check_login(me)) return;

		// 자기 서비스는 구매 불가
		if (is_own_service) {
			show_toast('error', '자신의 서비스는 구매할 수 없습니다.');
			return;
		}

		// URL에 선택 정보를 쿼리 파라미터로 전달
		const params = new URLSearchParams();
		params.set('quantity', quantity);
		if (selected_options.length > 0) {
			params.set('options', selected_options.join(','));
		}

		// replaceState: true로 현재 히스토리를 교체 (뒤로가기 시 무한루프 방지)
		goto(`/service/${service.id}/checkout?${params.toString()}`, {
			replaceState: true,
		});
	};

	const format_date = (date_string) =>
		new Date(date_string).toLocaleDateString('ko-KR', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		});

	const reset_order_form = () => {
		order_form_data = {
			depositor_name: '',
			bank: '',
			account_number: '',
			buyer_contact: '',
			special_request: '',
		};
	};

	const reset_review_form = () => {
		review_form_data = {
			rating: 0,
			title: '',
			content: '',
		};
	};

	// Validation Functions
	const validate_order_form = () => {
		if (!order_form_data.depositor_name.trim()) {
			show_toast('error', '입금자명을 입력해주세요.');
			return false;
		}
		if (!order_form_data.bank.trim()) {
			show_toast('error', '은행을 입력해주세요.');
			return false;
		}
		if (!order_form_data.account_number.trim()) {
			show_toast('error', '계좌번호를 입력해주세요.');
			return false;
		}
		if (!order_form_data.buyer_contact.trim()) {
			show_toast('error', '연락처를 입력해주세요.');
			return false;
		}
		return true;
	};

	const validate_review_form = () => {
		if (review_form_data.rating === 0) {
			show_toast('error', '별점을 선택해주세요.');
			return false;
		}
		if (!review_form_data.title.trim()) {
			show_toast('error', '리뷰 제목을 입력해주세요.');
			return false;
		}
		if (!review_form_data.content.trim()) {
			show_toast('error', '리뷰 내용을 입력해주세요.');
			return false;
		}
		return true;
	};

	// Like Handlers
	const handle_like = async (service_id) => {
		if (!check_login(me)) return;

		try {
			await api.service_likes.insert(service_id, me.id);
			service_likes = [...service_likes, { service_id }];
			show_toast('success', '서비스 좋아요를 눌렀어요!');

			// 앱 레벨 알림 생성: 서비스 작성자에게
			try {
				if (service?.users?.id && service.users.id !== me.id) {
					await api.notifications.insert({
						recipient_id: service.users.id,
						actor_id: me.id,
						type: 'service.liked',
						resource_type: 'service',
						resource_id: String(service_id),
						payload: { service_id, service_title: service.title },
						link_url: `/service/${service_id}`,
					});
				}
			} catch (e) {
				console.error('Failed to insert notification (service.liked):', e);
			}
		} catch (error) {
			console.error('좋아요 실패:', error);
			show_toast('error', '좋아요에 실패했습니다.');
		}
	};

	const handle_unlike = async (service_id) => {
		if (!check_login(me)) return;

		try {
			await api.service_likes.delete(service_id, me.id);
			service_likes = service_likes.filter(
				(service) => service.service_id !== service_id,
			);
			show_toast('success', '서비스 좋아요를 취소했어요!');
		} catch (error) {
			console.error('좋아요 취소 실패:', error);
			show_toast('error', '좋아요 취소에 실패했습니다.');
		}
	};

	// Order Handler
	const handle_order = async () => {
		if (!check_login(me) || !validate_order_form()) return;

		try {
			// 수수료 계산 (10% 기준)
			const commission_rate = 0.05;
			const commission = Math.floor(service.price * commission_rate);
			const total_with_commission = service.price + commission;

			const order_data = {
				buyer_id: me.id,
				seller_id: service.users.id,
				service_id: service.id,
				service_title: service.title,
				quantity: 1,
				unit_price: service.price,
				commission_amount: commission,
				total_with_commission: total_with_commission,
				depositor_name: order_form_data.depositor_name.trim(),
				bank: order_form_data.bank.trim(),
				account_number: order_form_data.account_number.trim(),
				buyer_contact: order_form_data.buyer_contact.trim(),
				special_request: order_form_data.special_request.trim(),
			};

			await api.service_orders.insert(order_data);

			// 앱 레벨 알림 생성: 판매자에게 주문 생성 알림
			try {
				if (service?.users?.id && service.users.id !== me.id) {
					await api.notifications.insert({
						recipient_id: service.users.id,
						actor_id: me.id,
						type: 'order.created',
						resource_type: 'order',
						resource_id: '',
						payload: {
							service_id: service.id,
							service_title: service.title,
							total: total_with_commission,
						},
						link_url: `/@${service.users.handle}/accounts/orders`,
					});
				}
			} catch (e) {
				console.error('Failed to insert notification (order.created):', e);
			}
			show_toast(
				'success',
				'주문이 성공적으로 접수되었습니다! 결제 확인 후 서비스가 제공됩니다.',
			);

			is_buy_modal_open = false;
			reset_order_form();
		} catch (error) {
			console.error('주문 생성 실패:', error);
			show_toast('error', '주문 접수에 실패했습니다. 다시 시도해주세요.');
		}
	};

	// Review Handlers
	const refresh_data = async () => {
		const [
			updated_service_reviews,
			updated_my_review,
			updated_service,
			updated_review_permission,
		] = await Promise.all([
			api.service_reviews.select_by_service_id(service.id),
			api.service_reviews.select_by_service_and_reviewer(service.id, me.id),
			api.services.select_by_id(service.id),
			api.service_reviews.can_write_review(service.id, me.id),
		]);

		service_reviews = updated_service_reviews;
		my_review = updated_my_review;
		service = updated_service;
		can_write_review = updated_review_permission.can_write;
		review_order_id = updated_review_permission.order_id;
	};

	const handle_review_submit = async () => {
		if (!check_login(me) || is_submitting_review || !validate_review_form())
			return;

		try {
			is_submitting_review = true;

			if (!editing_review && can_write_review) {
				// 아직 리뷰가 없는 완료된 주문이 존재 -> 새 리뷰 작성
				const review_data = {
					service_id: service.id,
					reviewer_id: me.id,
					order_id: review_order_id,
					rating: review_form_data.rating,
					title: review_form_data.title.trim(),
					content: review_form_data.content.trim(),
				};
				await api.service_reviews.insert(review_data);
				// 앱 레벨 알림: 서비스 작성자에게 리뷰 생성
				try {
					if (service?.users?.id && service.users.id !== me.id) {
						await api.notifications.insert({
							recipient_id: service.users.id,
							actor_id: me.id,
							type: 'review.created',
							resource_type: 'service',
							resource_id: String(service.id),
							payload: {
								service_id: service.id,
								service_title: service.title,
								rating: review_form_data.rating,
								title: review_form_data.title,
							},
							link_url: `/service/${service.id}#reviews`,
						});
					}
				} catch (e) {
					console.error('Failed to insert notification (review.created):', e);
				}
				show_toast('success', '리뷰가 작성되었습니다.');
			} else if (editing_review) {
				// 기존 리뷰 수정 (order_id는 변경하지 않음)
				await api.service_reviews.update(editing_review.id, {
					rating: review_form_data.rating,
					title: review_form_data.title.trim(),
					content: review_form_data.content.trim(),
				});
				show_toast('success', '리뷰가 수정되었습니다.');
			}

			await refresh_data();
			is_review_modal_open = false;
			editing_review = null;
			reset_review_form();
		} catch (error) {
			console.error('리뷰 작성/수정 실패:', error);
			show_toast('error', '리뷰 작성에 실패했습니다. 다시 시도해주세요.');
		} finally {
			is_submitting_review = false;
		}
	};

	const open_review_modal = (target_review = null) => {
		editing_review = target_review;
		if (target_review) {
			// 특정 리뷰 수정 모드
			review_form_data = {
				rating: target_review.rating,
				title: target_review.title || '',
				content: target_review.content || '',
			};
		} else {
			// 새 리뷰 작성 모드
			reset_review_form();
		}
		is_review_modal_open = true;
	};

	// Form validation computed properties
	const is_order_form_valid = $derived(
		order_form_data.depositor_name.trim() &&
			order_form_data.bank.trim() &&
			order_form_data.account_number.trim() &&
			order_form_data.buyer_contact.trim(),
	);

	const is_review_form_valid = $derived(
		review_form_data.rating > 0 &&
			review_form_data.title.trim() &&
			review_form_data.content.trim(),
	);

	// Service Management Handlers
	const handle_delete_service = async () => {
		if (!confirm('정말 이 서비스를 삭제하시겠습니까?')) return;

		try {
			await api.services.delete(service.id);
			show_toast('success', '서비스가 삭제되었습니다.');
			goto(`/@${me.handle}`, { replaceState: true });
		} catch (error) {
			console.error('서비스 삭제 실패:', error);
			show_toast('error', '서비스 삭제에 실패했습니다.');
		}
	};

	const open_service_config_modal = () => {
		if (!check_login(me)) return;
		is_service_config_modal_open = true;
	};
</script>

<svelte:head>
	<title>{service?.title || '서비스'} | 문</title>
	<meta
		name="description"
		content={service?.description ||
			'전문가가 제공하는 맞춤형 서비스입니다. 상세 정보를 확인하고 이용해보세요.'}
	/>

	<!-- Open Graph / Facebook -->
	<meta property="og:type" content="website" />
	<meta
		property="og:url"
		content={typeof window !== 'undefined' ? window.location.href : ''}
	/>
	<meta property="og:title" content={service?.title || '서비스'} />
	<meta
		property="og:description"
		content={service?.description ||
			'전문가가 제공하는 맞춤형 서비스입니다. 상세 정보를 확인하고 이용해보세요.'}
	/>
	<meta
		property="og:image"
		content={service?.images?.[0]?.uri ||
			service?.users?.avatar_url ||
			'%sveltekit.assets%/open_graph_img.png'}
	/>
	<meta property="og:image:width" content="1200" />
	<meta property="og:image:height" content="630" />
	<meta property="og:site_name" content="문" />
	<meta property="og:locale" content="ko_KR" />

	<!-- Twitter -->
	<meta property="twitter:card" content="summary_large_image" />
	<meta
		property="twitter:url"
		content={typeof window !== 'undefined' ? window.location.href : ''}
	/>
	<meta property="twitter:title" content={service?.title || '서비스'} />
	<meta
		property="twitter:description"
		content={service?.description ||
			'전문가가 제공하는 맞춤형 서비스입니다. 상세 정보를 확인하고 이용해보세요.'}
	/>
	<meta
		property="twitter:image"
		content={service?.images?.[0]?.uri ||
			service?.users?.avatar_url ||
			'%sveltekit.assets%/open_graph_img.png'}
	/>
</svelte:head>

<Header>
	<button slot="left" onclick={smartGoBack}>
		<RiArrowLeftSLine size={24} color={colors.gray[600]} />
	</button>
	<h1 slot="center" class="font-semibold">서비스</h1>
	<div slot="right">
		{#if is_own_service}
			<button onclick={open_service_config_modal}>
				<Icon attribute="ellipsis" size={20} color={colors.gray[500]} />
			</button>
		{/if}
	</div>
</Header>

<main>
	<!-- Service Images -->
	<figure>
		<CustomCarousel images={service.images.map((image) => image.uri)} />
	</figure>

	<div class="mx-4 mt-6">
		<!-- Service Provider Info -->
		<a href={`/@${service.users.handle}`} class="flex items-center">
			<img
				src={service.users.avatar_url || profile_png}
				alt={service.users.name}
				class="mr-2 aspect-square h-8 w-8 flex-shrink-0 rounded-full object-cover"
			/>
			<p class="pr-4 text-sm font-medium">@{service.users.handle}</p>
		</a>

		<!-- Service Title -->
		<div class="mt-2">
			<h1 class="text-lg font-semibold">{service.title}</h1>
		</div>

		<!-- Service Rating -->
		{#key service.rating}
			<div class="mt-1 flex items-center">
				<RiStarFill size={12} color={colors.primary} />
				<span class="ml-0.5 text-sm text-gray-500">
					{service.rating || 0}
				</span>

				<span class="ml-1 text-sm text-gray-500">
					({service.rating_count || 0})
				</span>
			</div>
		{/key}

		<!-- Service Price -->
		<p class="text-primary mt-4 text-xl font-bold">₩{comma(service.price)}</p>

		<!-- Service Description -->

		<!-- <div class="min-h-[184px] w-full rounded-[7px] bg-gray-50 px-5 py-4">
				<div class="text-sm whitespace-pre-wrap">{@html service.content}</div>
			</div> -->

		<div
			class="prose prose-sm mt-6 max-w-none leading-relaxed"
			style="white-space: pre-line;"
		>
			{@html service.content}
		</div>

		<style>
			.prose p {
				margin-bottom: 1rem;
				min-height: 1rem;
			}
			.prose h3 {
				margin-top: 1.5rem;
				margin-bottom: 0.75rem;
				font-size: 1.125rem;
				font-weight: 600;
			}
			.prose ul,
			.prose ol {
				margin-bottom: 1rem;
				padding-left: 1.5rem;
			}
			.prose li {
				margin-bottom: 0.5rem;
			}
			.prose strong {
				font-weight: 600;
			}
		</style>

		<!-- <iframe
			title="service_description"
			src={service.content}
			style="width: 100%; height: 500px; border: none !important; padding: 0"
			frameborder="0"
			allowfullscreen
		></iframe> -->

		<!-- Reviews Section -->
		{#key service_reviews.length + (my_review?.id || 0)}
			<div class="mt-8">
				<div class="mb-4 flex items-center justify-between">
					<h2 class="text-lg font-semibold">리뷰 ({service_reviews.length})</h2>
					{#if can_write_review}
						<button
							onclick={() => open_review_modal()}
							class="bg-primary hover:bg-primary-dark rounded-md px-3 py-1.5 text-sm text-white"
						>
							리뷰 작성
						</button>
					{/if}
				</div>

				{#if service_reviews.length === 0}
					<div class="py-8 text-center text-gray-500">
						<p>아직 리뷰가 없습니다.</p>
						{#if can_write_review}
							<p class="mt-1 text-sm">첫 리뷰를 작성해보세요!</p>
						{/if}
					</div>
				{:else}
					<div class="space-y-4">
						{#each service_reviews as review (review.id)}
							<div class="rounded-lg border border-gray-200 bg-white p-4">
								<div class="flex items-start justify-between">
									<div class="flex items-center">
										<img
											src={review.reviewer.avatar_url || '/favicon.png'}
											alt={review.reviewer.name}
											class="mr-3 aspect-square h-8 w-8 rounded-full object-cover"
										/>
										<div>
											<p class="text-sm font-medium">
												@{review.reviewer.handle}
											</p>

											<StarRating
												rating={review.rating}
												readonly={true}
												size={14}
											/>
										</div>
									</div>

									<span class="text-xs text-gray-500"
										>{format_date(review.created_at)}
									</span>
								</div>

								<div class="flex justify-between">
									<div>
										{#if review.title}
											<h3 class="mt-3 mb-1 font-medium">{review.title}</h3>
										{/if}
										{#if review.content}
											<p
												class="text-sm leading-relaxed whitespace-pre-wrap text-gray-700"
											>
												{review.content}
											</p>
										{/if}
									</div>
									<div class="flex flex-col self-end">
										{#if review.reviewer_id === me.id}
											<div>
												<button
													onclick={() => open_review_modal(review)}
													class="btn btn-sm text-primary text-xs"
												>
													수정하기
												</button>
											</div>
										{/if}
									</div>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		{/key}
	</div>

	<!-- Bottom Action Bar -->
	<div class="fixed bottom-0 w-full max-w-screen-md bg-white px-4 py-3.5">
		<div class="pb-safe flex space-x-2">
			{#if !is_own_service}
				<button
					class="btn btn-primary flex h-9 flex-1 items-center justify-center"
					onclick={() => {
						if (!check_login(me)) return;
						is_options_modal_open = true;
					}}
				>
					구매하기
				</button>
				<button
					onclick={() => {
						copy_to_clipboard(
							service.contact_info,
							'문의 링크가 복사되었습니다.',
						);
					}}
					class="btn flex h-9 flex-1 items-center justify-center border-none bg-gray-100"
				>
					문의하기
				</button>
			{:else}
				<button
					onclick={() => goto(`/@${me.handle}/accounts/orders`)}
					class="btn flex h-9 flex-1 items-center justify-center border-none bg-gray-100"
				>
					내 서비스 관리
				</button>
			{/if}
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

<!-- Options Selection Modal (Bottom Sheet) -->
<Modal bind:is_modal_open={is_options_modal_open} modal_position="bottom">
	<div class="p-5">
		<div class="mb-5 flex items-start justify-between">
			<div>
				<h3 class="text-lg font-semibold">{service.title}</h3>
				<p class="mt-1 text-sm text-gray-600">₩{comma(service.price)}</p>
			</div>
			<button onclick={() => (is_options_modal_open = false)}>
				<RiCloseLine size={24} color={colors.gray[400]} />
			</button>
		</div>

		{#if service_options && service_options.length > 0}
			<div class="mb-5">
				<p class="mb-3 text-sm font-medium text-gray-900">추가 옵션</p>
				<div class="space-y-2">
					{#each service_options as option}
						<label
							class="flex cursor-pointer items-center justify-between rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50"
						>
							<div class="flex items-center">
								<input
									type="checkbox"
									checked={selected_options.includes(option.id)}
									onchange={() => toggle_option(option.id)}
									class="mr-3 h-4 w-4 rounded border-gray-300"
								/>
								<div>
									<p class="text-sm font-medium">{option.name}</p>
									{#if option.description}
										<p class="text-xs text-gray-500">{option.description}</p>
									{/if}
								</div>
							</div>
							<p class="text-sm font-medium text-gray-700">
								+₩{comma(option.price_add)}
							</p>
						</label>
					{/each}
				</div>
			</div>
		{/if}

		<div class="mb-5">
			<p class="mb-3 text-sm font-medium text-gray-900">수량</p>
			<div class="flex items-center">
				<button
					onclick={decrease_quantity}
					class="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 text-lg font-medium text-gray-700"
				>
					−
				</button>
				<span class="mx-4 text-lg font-medium">{quantity}</span>
				<button
					onclick={increase_quantity}
					class="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-300 text-lg font-medium text-gray-700"
				>
					+
				</button>
			</div>
		</div>

		<div class="mb-5 rounded-lg bg-gray-50 p-4">
			<div class="flex items-center justify-between text-lg">
				<span class="font-medium text-gray-900">총 금액</span>
				<span class="font-bold text-gray-900">₩{comma(calculate_total())}</span>
			</div>
		</div>

		<button
			onclick={proceed_to_checkout}
			class="btn btn-primary h-12 w-full rounded-lg text-base font-medium"
		>
			바로 구매하기
		</button>
	</div>
</Modal>

<!-- Review Modal -->
<Modal bind:is_modal_open={is_review_modal_open} modal_position="center">
	<div class="p-4">
		<div class="flex items-center justify-between">
			<h3 class="font-semibold">
				{editing_review ? '리뷰 수정' : '리뷰 작성'}
			</h3>
			<button
				onclick={() => {
					is_review_modal_open = false;
					editing_review = null;
				}}
			>
				<RiCloseLine size={24} color={colors.gray[400]} />
			</button>
		</div>

		<div class="mt-6 space-y-4">
			<div>
				<p class="mb-2 text-sm font-medium">별점</p>
				<StarRating
					bind:rating={review_form_data.rating}
					size={24}
					show_rating_text={true}
				/>
			</div>

			<div>
				<p class="text-sm font-medium">리뷰 제목</p>
				<input
					bind:value={review_form_data.title}
					type="text"
					placeholder="리뷰 제목을 입력해주세요"
					class={INPUT_CLASS}
				/>
			</div>

			<div>
				<p class="text-sm font-medium">리뷰 내용</p>
				<textarea
					bind:value={review_form_data.content}
					placeholder="서비스에 대한 자세한 리뷰를 작성해주세요"
					class="{INPUT_CLASS} resize-none"
					rows="5"
				></textarea>
			</div>
		</div>

		<div class="my-4 h-px bg-gray-200"></div>

		<button
			onclick={handle_review_submit}
			disabled={is_submitting_review || !is_review_form_valid}
			class={BUTTON_CLASS}
		>
			{#if is_submitting_review}
				<span class="flex items-center">
					<svg class="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
						<circle
							class="opacity-25"
							cx="12"
							cy="12"
							r="10"
							stroke="currentColor"
							stroke-width="4"
						></circle>
						<path
							class="opacity-75"
							fill="currentColor"
							d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
						></path>
					</svg>
					{editing_review ? '수정 중...' : '작성 중...'}
				</span>
			{:else}
				{editing_review ? '리뷰 수정하기' : '리뷰 작성하기'}
			{/if}
		</button>
	</div>
</Modal>

<!-- Service Config Modal -->
<Modal
	bind:is_modal_open={is_service_config_modal_open}
	modal_position="bottom"
>
	<div class="flex flex-col items-center bg-gray-100 p-4 text-sm font-medium">
		<div class="flex w-full flex-col items-center rounded-lg bg-white">
			<a
				href={`/regi/service/${service.id}`}
				class="flex w-full items-center gap-3 p-3"
			>
				<RiPencilLine size={20} color={colors.gray[400]} />
				<p class="text-gray-600">수정하기</p>
			</a>
		</div>
	</div>
</Modal>
