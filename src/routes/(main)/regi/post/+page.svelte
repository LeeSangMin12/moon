<script>
	import { PUBLIC_SUPABASE_URL } from '$env/static/public';
	import Select from 'svelte-select';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { RiArrowLeftSLine, RiMenuLine } from 'svelte-remixicon';

	import Header from '$lib/components/ui/Header/+page.svelte';

	import colors from '$lib/js/colors';
	import { show_toast } from '$lib/js/common';
	import { api_store } from '$lib/store/api_store.js';
	import { update_global_store } from '$lib/store/global_store.js';
	import { user_store } from '$lib/store/user_store.js';

	const TITLE = '게시글 작성';

	let { data } = $props();
	let { community_members } = $derived(data);

	const community_select_options = $derived([
		{ value: null, label: '모두에게', group: '대상' },
		...(community_members || []).map((item) => ({
			value: item.communities.id,
			label: item.communities.title,
			group: '커뮤니티',
		})),
	]);
	let community_select_value = $state({
		value: null,
		label: '모두에게',
		group: '대상',
	});

	let post_form_data = $state({
		title: '',
		content: '',
		images: [],
	});

	let upload_type = $state('image'); // 'image' 또는 'video'

	/**
	 * 이미지 추가
	 */
	const add_img = (event) => {
		const selected_images = event.target.files; //input요소 선택한 파일
		let images_copy = [...post_form_data.images]; //선택된 이미지의 복사본

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
		post_form_data.images = images_copy;
	};

	/**
	 * 이미지 삭제
	 */
	const delete_img = (idx) => {
		const update_images = [...post_form_data.images];
		update_images.splice(idx, 1);
		post_form_data.images = update_images;
	};

	const save_post = async () => {
		update_global_store('loading', true);
		try {
			const new_post = await $api_store.posts.insert({
				community_id: community_select_value?.value || null,
				title: post_form_data.title,
				content: post_form_data.content,
				author_id: $user_store.id,
			});

			if (post_form_data.images.length > 0) {
				const uploaded_images = await upload_images(
					new_post.id,
					post_form_data.images,
				);
				await $api_store.posts.update(new_post.id, {
					images: uploaded_images,
				});
			}

			show_toast('success', '게시글이 저장되었습니다.');
			goto('/');
		} finally {
			update_global_store('loading', false);
		}
	};

	const upload_images = async (post_id, images) => {
		return Promise.all(
			images.map(async (img_file, i) => {
				const file_ext = img_file.name.split('.').pop();
				const file_path = `${post_id}/${Date.now()}-${i}.${file_ext}`;

				await $api_store.post_images.upload(file_path, img_file);
				return {
					uri: `${PUBLIC_SUPABASE_URL}/storage/v1/object/public/posts/images/${file_path}`,
				};
			}),
		);
	};

	const add_file = (event) => {
		console.log(event.target.files);
		const selected_files = event.target.files;
		let files_copy = [];

		if (upload_type === 'image') {
			files_copy = [...post_form_data.images];
			for (let i = 0; i < selected_files.length; i++) {
				if (selected_files[i].type.startsWith('image/')) {
					selected_files[i].uri = URL.createObjectURL(selected_files[i]);
					files_copy.push(selected_files[i]);
				}
			}
			if (files_copy.length > 7) {
				alert('이미지 개수는 7개를 초과할 수 없습니다.');
				return;
			}
		} else if (upload_type === 'video') {
			if (selected_files.length > 1) {
				alert('영상은 1개만 업로드할 수 있습니다.');
				return;
			}
			if (!selected_files[0].type.startsWith('video/')) {
				alert('영상 파일만 업로드할 수 있습니다.');
				return;
			}
			selected_files[0].uri = URL.createObjectURL(selected_files[0]);
			files_copy = [selected_files[0]];
		}

		post_form_data.images = files_copy;
		event.target.value = '';
	};
</script>

<Header>
	<button slot="left" class="flex items-center" onclick={() => goto('/')}>
		<RiArrowLeftSLine size={26} color={colors.gray[600]} />
	</button>

	<h1 slot="center" class="font-semibold">{TITLE}</h1>
</Header>

<main class="mx-4">
	<div class="rounded-lg border border-gray-200">
		<Select
			items={community_select_options}
			bind:value={community_select_value}
			groupBy={(item) => item.group}
			clearable={false}
		/>
	</div>

	<div class="mt-6">
		<span class="ml-1 text-sm font-medium">안내이미지 (선택)</span>

		<div class="my-3 flex gap-2">
			<button
				class={`btn btn-sm  ${upload_type === 'image' ? 'btn-primary' : 'bg-gray-100'}`}
				class:selected={upload_type === 'image'}
				onclick={() => {
					if (post_form_data.images.length === 0) upload_type = 'image';
					else show_toast('warning', '업로드된 파일을 먼저 삭제하세요.');
				}}>이미지 업로드</button
			>
			<button
				class={`btn btn-sm ${upload_type === 'video' ? 'btn-primary' : 'bg-gray-100'}`}
				class:selected={upload_type === 'video'}
				onclick={() => {
					if (post_form_data.images.length === 0) upload_type = 'video';
					else show_toast('warning', '업로드된 파일을 먼저 삭제하세요.');
				}}>영상 업로드</button
			>
		</div>

		<div class="mt-2 flex overflow-x-auto">
			<label for="input-file">
				<input
					type="file"
					id="input-file"
					onchange={add_file}
					accept={upload_type === 'image' ? 'image/*' : 'video/*'}
					multiple={upload_type === 'image'}
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

					<span class="text-xs text-gray-900">
						{upload_type === 'image'
							? `${post_form_data.images.length}/7`
							: `${post_form_data.images.length}/1`}
					</span>
				</div>
			</label>

			<div class="flex flex-row">
				{#each post_form_data.images as img, idx}
					<div class="relative min-w-max">
						{#if img.type && img.type.startsWith('video/')}
							<video
								key={idx}
								class="ml-3 h-20 w-20 flex-shrink-0 rounded-lg object-cover"
								src={img.uri}
								controls
								alt={img.name}
							/>
						{:else}
							<img
								key={idx}
								class="ml-3 h-20 w-20 flex-shrink-0 rounded-lg object-cover"
								src={img.uri}
								alt={img.name}
							/>
						{/if}
						<button onclick={() => delete_img(idx)} aria-label="삭제">
							<svg
								class="absolute top-[-2px] left-20"
								xmlns="http://www.w3.org/2000/svg"
								width="1.3rem"
								height="1.3rem"
								viewBox="0 0 24 24"
							>
								<path
									fill={colors.gray[900]}
									d="m8.4 17l3.6-3.6l3.6 3.6l1.4-1.4l-3.6-3.6L17 8.4L15.6 7L12 10.6L8.4 7L7 8.4l3.6 3.6L7 15.6zm3.6 5q-2.075 0-3.9-.788t-3.175-2.137T2.788 15.9T2 12t.788-3.9t2.137-3.175T8.1 2.788T12 2t3.9.788t3.175 2.137T21.213 8.1T22 12t-.788 3.9t-2.137 3.175t-3.175 2.138T12 22"
								/>
							</svg>
						</button>
					</div>
				{/each}
			</div>
		</div>
	</div>

	<div class="mt-8">
		<p class="ml-1 text-sm font-medium">글 제목</p>

		<div class="mt-2">
			<input
				bind:value={post_form_data.title}
				type="text"
				class="input input-bordered focus:border-primary h-[52px] w-full focus:outline-none"
			/>
		</div>
	</div>

	<div class="mt-8 flex flex-col">
		<p class="ml-1 text-sm font-medium">글 내용</p>

		<div class="mt-2">
			<textarea
				bind:value={post_form_data.content}
				type="text"
				class="textarea input input-bordered focus:border-primary h-40 w-full focus:outline-none"
			></textarea>
		</div>
	</div>
</main>
<div class="fixed bottom-0 w-full max-w-screen-md bg-white px-5 py-3.5">
	<div class="pb-safe flex space-x-2">
		<button
			disabled={post_form_data.title.length === 0 ||
				post_form_data.content.length === 0}
			class="btn btn-primary flex flex-1 items-center justify-center"
			onclick={save_post}
		>
			게시하기
		</button>
	</div>
</div>
