<script>
	import { PUBLIC_SUPABASE_URL } from '$env/static/public';
	import Select from 'svelte-select';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { smartGoBack } from '$lib/utils/navigation';
	import { RiArrowLeftSLine, RiMenuLine } from 'svelte-remixicon';

	import Header from '$lib/components/ui/Header/+page.svelte';

	import colors from '$lib/js/colors';
	import { show_toast, check_login } from '$lib/js/common';
	import { api_store } from '$lib/store/api_store.js';
	import { update_global_store } from '$lib/store/global_store.js';
	import { user_store } from '$lib/store/user_store.js';

	const TITLE = '서비스 등록';

	let { data } = $props();

	let service_form_data = $state({
		title: '',
		content: '',
		price: 0,
		images: [],
	});

	onMount(() => {
		// Check if user is logged in when page loads
		if (!check_login()) {
			goto('/login');
			return;
		}
	});

	/**
	 * 이미지 추가
	 */
	const add_img = (event) => {
		const selected_images = event.target.files; //input요소 선택한 파일
		let images_copy = [...service_form_data.images]; //선택된 이미지의 복사본

		//미리보기용 이미지 uri 생성후 복사본에 추가
		for (let i = 0; i < selected_images.length; i++) {
			selected_images[i].uri = URL.createObjectURL(selected_images[i]);

			images_copy.push(selected_images[i]);
		}

		//이미지 개수가 7개 이상이면 에러
		if (images_copy.length > 7) {
			alert('이미지 개수는 7개를 초과할 수 없습니다.');
			return;
		}

		// 이미지 상태 업데이트
		service_form_data.images = images_copy;
	};

	/**
	 * 이미지 삭제
	 */
	const delete_img = (idx) => {
		const update_images = [...service_form_data.images];
		update_images.splice(idx, 1);
		service_form_data.images = update_images;
	};

	const save_service = async () => {
		update_global_store('loading', true);
		try {
			// Check if user is logged in
			if (!$user_store?.id) {
				show_toast('error', '로그인이 필요합니다.');
				return;
			}

			const new_service = await $api_store.services.insert({
				author_id: $user_store.id,
				title: service_form_data.title,
				content: service_form_data.content,
				price: service_form_data.price,
			});

			if (service_form_data.images.length > 0) {
				const uploaded_images = await upload_images(
					new_service.id,
					service_form_data.images,
				);
				await $api_store.services.update(new_service.id, {
					images: uploaded_images,
				});
			}

			show_toast('success', '서비스가 저장되었습니다.');
			goto('/service');
		} finally {
			update_global_store('loading', false);
		}
	};

	const upload_images = async (service_id, images) => {
		return Promise.all(
			images.map(async (img_file, i) => {
				const file_ext = img_file.name.split('.').pop();
				const file_path = `${service_id}/${Date.now()}-${i}.${file_ext}`;

				await $api_store.service_images.upload(file_path, img_file);
				return {
					uri: `${PUBLIC_SUPABASE_URL}/storage/v1/object/public/services/images/${file_path}`,
				};
			}),
		);
	};
</script>

<svelte:head>
	<title>서비스 등록 | 문</title>
	<meta
		name="description"
		content="서비스를 등록할 수 있는 문의 서비스 등록 페이지입니다."
	/>
</svelte:head>

<Header>
	<button
		slot="left"
		class="flex items-center"
		onclick={smartGoBack}
	>
		<RiArrowLeftSLine size={26} color={colors.gray[600]} />
	</button>

	<h1 slot="center" class="font-semibold">{TITLE}</h1>
</Header>

<main class="mx-4">
	<div class="">
		<span class="ml-1 text-sm font-medium">서비스 이미지</span>

		<div class="mt-2 flex overflow-x-auto">
			<label for="input-file">
				<input
					type="file"
					id="input-file"
					onchange={add_img}
					accept="image/*,"
					multiple
					class="hidden"
				/>
				<div
					class="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-lg bg-gray-50"
				>
					<svg
						width="20"
						height="20"
						viewBox="0 0 24 21"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<path
							d="M14.14 2.33333L16.275 4.66667H21V18.6667H2.33333V4.66667H7.05833L9.19333 2.33333H14.14ZM15.1667 0H8.16667L6.03167 2.33333H2.33333C1.05 2.33333 0 3.38333 0 4.66667V18.6667C0 19.95 1.05 21 2.33333 21H21C22.2833 21 23.3333 19.95 23.3333 18.6667V4.66667C23.3333 3.38333 22.2833 2.33333 21 2.33333H17.3017L15.1667 0ZM11.6667 8.16667C13.5917 8.16667 15.1667 9.74167 15.1667 11.6667C15.1667 13.5917 13.5917 15.1667 11.6667 15.1667C9.74167 15.1667 8.16667 13.5917 8.16667 11.6667C8.16667 9.74167 9.74167 8.16667 11.6667 8.16667ZM11.6667 5.83333C8.44667 5.83333 5.83333 8.44667 5.83333 11.6667C5.83333 14.8867 8.44667 17.5 11.6667 17.5C14.8867 17.5 17.5 14.8867 17.5 11.6667C17.5 8.44667 14.8867 5.83333 11.6667 5.83333Z"
							fill="#A9A9A9"
						/>
					</svg>

					<span class="text-xs text-gray-900"
						>{service_form_data.images.length}/7</span
					>
				</div>
			</label>

			<div class="flex flex-row">
				{#each service_form_data.images as img, idx}
					<div class="relative min-w-max">
						<img
							key={idx}
							class="ml-3 h-20 w-20 flex-shrink-0 rounded-lg object-cover"
							src={img.uri}
							alt={img.name}
						/>
						<button onclick={() => delete_img(idx)} aria-label="삭제">
							<svg
								class="absolute top-[-2px] left-20"
								xmlns="http://www.w3.org/2000/svg"
								width="1.3rem"
								height="1.3rem"
								viewBox="0 0 24 24"
								><path
									fill={colors.gray[900]}
									d="m8.4 17l3.6-3.6l3.6 3.6l1.4-1.4l-3.6-3.6L17 8.4L15.6 7L12 10.6L8.4 7L7 8.4l3.6 3.6L7 15.6zm3.6 5q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22"
								/></svg
							>
						</button>
					</div>
				{/each}
			</div>
		</div>
	</div>

	<div class="mt-4">
		<p class="ml-1 text-sm font-medium">서비스 제목</p>

		<div class="mt-2">
			<input
				bind:value={service_form_data.title}
				type="text"
				class="input input-bordered focus:border-primary h-[52px] w-full focus:outline-none"
			/>
		</div>
	</div>

	<div class="mt-4 flex flex-col">
		<p class="ml-1 text-sm font-medium">서비스 내용</p>

		<div class="mt-2">
			<textarea
				bind:value={service_form_data.content}
				type="text"
				class="textarea input input-bordered focus:border-primary h-40 w-full focus:outline-none"
			></textarea>
		</div>
	</div>

	<div class="mt-4">
		<p class="ml-1 text-sm font-medium">서비스 가격</p>

		<div class="mt-2">
			<input
				bind:value={service_form_data.price}
				type="number"
				class="input input-bordered focus:border-primary h-[52px] w-full focus:outline-none"
			/>
		</div>
	</div>
</main>

<div class="fixed bottom-0 w-full max-w-screen-md bg-white px-5 py-3.5">
	<div class="pb-safe flex space-x-2">
		<button
			disabled={service_form_data.title.length === 0 ||
				service_form_data.content.length === 0 ||
				service_form_data.price === 0 ||
				service_form_data.images.length === 0}
			class="btn btn-primary flex flex-1 items-center justify-center"
			onclick={save_service}
		>
			등록하기
		</button>
	</div>
</div>
