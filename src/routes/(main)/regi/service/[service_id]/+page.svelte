<script>
	import { PUBLIC_SUPABASE_URL } from '$env/static/public';
	import { smart_go_back } from '$lib/utils/navigation';
	import { goto } from '$app/navigation';
	import { RiArrowLeftSLine } from 'svelte-remixicon';

	import Header from '$lib/components/ui/Header.svelte';
	import SimpleEditor from '$lib/components/tiptap-templates/simple/simple-editor.svelte';

	import colors from '$lib/config/colors';
	import { check_login, show_toast } from '$lib/utils/common';
	import { get_user_context, get_api_context } from '$lib/contexts/app_context.svelte.js';
	import { update_global_store } from '$lib/store/global_store.js';

	const me = get_user_context();
	const api = get_api_context();

	const TITLE = '서비스 수정';

	let { data } = $props();
	let { service, service_options } = $state(data);

	let service_form_data = $state({
		title: service.title || '',
		content: service.content || '',
		price: service.price || 0,
		contact_info: service.contact_info || '',
		images: service.images || [],
		options: service_options || [],
	});

	/**
	 * 이미지 추가
	 */
	const add_img = (event) => {
		const selected_images = event.target.files;
		let images_copy = [...service_form_data.images];

		for (let i = 0; i < selected_images.length; i++) {
			selected_images[i].uri = URL.createObjectURL(selected_images[i]);

			// 이미지 크기 확인 및 권장사항 안내
			const img = new Image();
			img.onload = () => {
				const aspectRatio = img.width / img.height;
				const isRecommendedSize = img.width >= 652 && img.height >= 488;
				const isRecommendedRatio = aspectRatio >= 1.3 && aspectRatio <= 1.4;

				if (!isRecommendedSize || !isRecommendedRatio) {
					show_toast(
						'info',
						'권장 크기: 652x488px (4:3 비율)로 업로드하면 더 좋은 품질을 얻을 수 있어요!',
					);
				}
			};
			img.src = selected_images[i].uri;

			images_copy.push(selected_images[i]);
		}

		if (images_copy.length > 7) {
			alert('이미지 개수는 7개를 초과할 수 없습니다.');
			return;
		}

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

	/**
	 * 옵션 추가
	 */
	const add_option = () => {
		service_form_data.options = [
			...service_form_data.options,
			{ name: '', price_add: 0, description: '', display_order: service_form_data.options.length }
		];
	};

	/**
	 * 옵션 삭제
	 */
	const delete_option = (idx) => {
		const updated_options = [...service_form_data.options];
		updated_options.splice(idx, 1);
		updated_options.forEach((opt, i) => opt.display_order = i);
		service_form_data.options = updated_options;
	};

	const save_service = async () => {
		update_global_store('loading', true);
		try {
			if (!me?.id) {
				show_toast('error', '로그인이 필요합니다.');
				return;
			}

			// 서비스 기본 정보 업데이트
			await api.services.update(service.id, {
				title: service_form_data.title,
				content: service_form_data.content,
				price: service_form_data.price,
				contact_info: service_form_data.contact_info,
			});

			// 이미지 처리
			if (service_form_data.images.length > 0) {
				const uploaded_images = await modify_images(
					service.id,
					service_form_data.images,
				);
				await api.services.update(service.id, {
					images: uploaded_images,
				});
			}

			// 옵션 처리: 기존 옵션 모두 삭제 후 재삽입
			await api.service_options.delete_by_service_id(service.id);

			if (service_form_data.options.length > 0) {
				const options_to_insert = service_form_data.options
					.filter(opt => opt.name.trim() && opt.price_add > 0)
					.map(opt => ({
						service_id: service.id,
						name: opt.name.trim(),
						price_add: opt.price_add,
						description: opt.description?.trim() || null,
						display_order: opt.display_order,
					}));

				if (options_to_insert.length > 0) {
					await api.service_options.insert_bulk(options_to_insert);
				}
			}

			show_toast('success', '서비스가 수정되었습니다.');
			goto(`/service/${service.id}`, { replaceState: true });
		} catch (error) {
			console.error('서비스 수정 실패:', error);
			show_toast('error', '서비스 수정에 실패했습니다.');
		} finally {
			update_global_store('loading', false);
		}
	};

	const modify_images = async (service_id, images) => {
		return Promise.all(
			images.map(async (img_file, i) => {
				// 기존 이미지인 경우 (uri만 있고 name이 없음)
				if (img_file?.name === undefined) return { uri: img_file.uri };

				// 새로 업로드하는 이미지
				const file_ext = img_file.name.split('.').pop();
				const file_path = `${service_id}/${Date.now()}-${i}.${file_ext}`;

				await api.service_images.upload(file_path, img_file);
				return {
					uri: `${PUBLIC_SUPABASE_URL}/storage/v1/object/public/services/images/${file_path}`,
				};
			}),
		);
	};
</script>

<svelte:head>
	<title>서비스 수정 | 문</title>
	<meta
		name="description"
		content="서비스를 수정할 수 있는 문의 서비스 수정 페이지입니다."
	/>
</svelte:head>

<Header>
	<button slot="left" class="flex items-center" onclick={smart_go_back}>
		<RiArrowLeftSLine size={26} color={colors.gray[600]} />
	</button>

	<h1 slot="center" class="font-semibold">{TITLE}</h1>
</Header>

<main class="mx-4">
	<div class="">
		<span class="ml-1 text-sm font-medium">서비스 이미지</span>
		<p class="mt-1 ml-1 text-xs text-gray-500">
			권장 크기: 652x488px (4:3 비율), 최대 7개
		</p>

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
					<div class="relative ml-3 min-w-max">
						<div class="aspect-[4/3] h-24 w-32 overflow-hidden rounded-lg">
							<img
								key={idx}
								class="h-full w-full object-cover"
								src={img.uri}
								alt={img.name || 'service image'}
								loading="eager"
							/>
						</div>
						<button onclick={() => delete_img(idx)} aria-label="삭제">
							<svg
								class="absolute -top-1 -right-1"
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

	<div class="mt-4">
		<p class="ml-1 text-sm font-medium">추가 옵션 (선택)</p>
		<p class="mt-1 ml-1 text-xs text-gray-500">
			고객이 선택할 수 있는 추가 옵션을 등록해보세요
		</p>

		<div class="mt-3 space-y-3">
			{#each service_form_data.options as option, idx}
				<div class="rounded-lg border border-gray-200 bg-gray-50 p-4">
					<div class="mb-3 flex items-center justify-between">
						<span class="text-sm font-medium text-gray-700">옵션 {idx + 1}</span>
						<button
							onclick={() => delete_option(idx)}
							class="text-sm text-gray-500 hover:text-gray-700"
							type="button"
						>
							삭제
						</button>
					</div>

					<div class="space-y-3">
						<div>
							<input
								bind:value={option.name}
								type="text"
								placeholder="옵션 이름 (예: 소스파일 제공)"
								class="input input-bordered h-11 w-full text-sm focus:outline-none focus:border-gray-400"
							/>
						</div>

						<div>
							<input
								bind:value={option.price_add}
								type="number"
								placeholder="추가 금액 (원)"
								class="input input-bordered h-11 w-full text-sm focus:outline-none focus:border-gray-400"
							/>
						</div>

						<div>
							<input
								bind:value={option.description}
								type="text"
								placeholder="설명 (선택)"
								class="input input-bordered h-11 w-full text-sm focus:outline-none focus:border-gray-400"
							/>
						</div>
					</div>
				</div>
			{/each}

			<button
				onclick={add_option}
				type="button"
				class="flex h-11 w-full items-center justify-center rounded-lg border-2 border-dashed border-gray-300 text-sm text-gray-600 hover:border-gray-400 hover:text-gray-700"
			>
				+ 옵션 추가
			</button>
		</div>
	</div>

	<div class="mt-4">
		<p class="ml-1 text-sm font-medium">문의 연락처</p>
		<p class="mt-1 ml-1 text-xs text-gray-500">
			고객이 서비스 문의 시 연락할 수 있는 연락처를 입력해주세요
		</p>

		<div class="mt-2">
			<input
				bind:value={service_form_data.contact_info}
				type="text"
				placeholder="예: 010-1234-5678, 카카오톡 링크, 인스타그램 링크"
				class="input input-bordered focus:border-primary h-[52px] w-full focus:outline-none"
			/>
		</div>
	</div>

	<div class="mt-4 flex flex-col">
		<p class="ml-1 text-sm font-medium">서비스 내용</p>

		<div class="mt-2">
			<SimpleEditor bind:content={service_form_data.content} />
		</div>
	</div>
</main>

<div class="fixed bottom-0 w-full max-w-screen-md bg-white px-5 py-3.5">
	<div class="pb-safe flex space-x-2">
		<button
			disabled={service_form_data.title.length === 0 ||
				service_form_data.content.length === 0 ||
				service_form_data.price === 0 ||
				service_form_data.contact_info.length === 0 ||
				service_form_data.images.length === 0}
			class="btn btn-primary flex flex-1 items-center justify-center"
			onclick={save_service}
		>
			수정하기
		</button>
	</div>
</div>
