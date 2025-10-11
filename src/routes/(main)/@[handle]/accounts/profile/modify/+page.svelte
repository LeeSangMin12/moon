<script>
	import { PUBLIC_SUPABASE_URL } from '$env/static/public';
	import profile_png from '$lib/img/common/user/profile.png';
	import { goto } from '$app/navigation';
	import { RiArrowLeftSLine } from 'svelte-remixicon';

	import Header from '$lib/components/ui/Header.svelte';

	import colors from '$lib/config/colors';
	import { show_toast } from '$lib/utils/common';
	import { get_user_context, get_api_context } from '$lib/contexts/app-context.svelte.js';
	import { update_global_store } from '$lib/store/global_store';

	const { me } = get_user_context();
	const { api } = get_api_context();

	let form = $state({
		name: me?.name || '',
		avatar_url: me?.avatar_url || '',
		self_introduction: me?.self_introduction || '',
	});

	let is_submitting = $state(false);

	const handle_submit = async () => {
		if (!me?.id) return;
		is_submitting = true;
		try {
			await api.users.update(me.id, {
				name: form.name,
				self_introduction: form.self_introduction,
			});
			Object.assign(me, {
				name: form.name,
				self_introduction: form.self_introduction,
			});

			show_toast('success', '프로필이 수정되었습니다.');
		} catch (e) {
			console.log(e);
			show_toast('error', '프로필 수정에 실패했습니다.');
		} finally {
			is_submitting = false;
		}
	};

	const modify_avatar_url = async (event) => {
		if (!me?.id) return;
		update_global_store('loading', true);
		try {
			const selected_img = event.target.files[0];
			selected_img.uri = URL.createObjectURL(selected_img);

			const file_ext = selected_img.name.split('.').pop();
			const file_path = `avatars/${me.id}/${Date.now()}.${file_ext}`;

			await api.user_avatars.upload(file_path, selected_img);

			const img_url = `${PUBLIC_SUPABASE_URL}/storage/v1/object/public/users/${file_path}`;
			await api.users.update(me.id, {
				avatar_url: img_url,
			});

			form.avatar_url = img_url;
			Object.assign(me, { avatar_url: img_url });

			show_toast('success', '수정이 완료되었습니다.');
		} finally {
			update_global_store('loading', false);
		}
	};
</script>

<svelte:head>
	<title>프로필 수정 | 문</title>
	<meta
		name="description"
		content="프로필 사진과 이름, 소개글을 수정할 수 있는 문의 프로필 수정 페이지입니다."
	/>
</svelte:head>

<Header>
	<a slot="left" href={`/@${me?.handle}/accounts/profile`}>
		<RiArrowLeftSLine size={24} color={colors.gray[800]} />
	</a>
	<h1 slot="center" class="font-semibold">프로필 수정</h1>
</Header>

<main class="p-4">
	<p class="ml-1 font-semibold">프로필 사진 수정</p>

	<div class="mt-2 flex justify-center">
		<div class="flex items-center justify-center">
			<label for="input-file">
				<input
					type="file"
					id="input-file"
					accept="image/*,"
					multiple
					class="hidden"
					onchange={modify_avatar_url}
				/>
				<div class="avatar relative">
					<div class="w-24 rounded-full">
						{#if form.avatar_url}
							<img src={form.avatar_url} alt="user_profile_png" />
						{:else}
							<img src={profile_png} alt="user_profile_png" />
						{/if}
					</div>

					<svg
						class="absolute right-0 bottom-0"
						width="28"
						height="29"
						viewBox="0 0 30 31"
						fill="none"
						xmlns="http://www.w3.org/2000/svg"
					>
						<rect y="0.808594" width="30" height="30" rx="15" fill="#237BF8" />
						<path
							d="M16.484 11.1419L17.765 12.4753H20.6V20.4753H9.4V12.4753H12.235L13.516 11.1419H16.484ZM17.1 9.80859H12.9L11.619 11.1419H9.4C8.63 11.1419 8 11.7419 8 12.4753V20.4753C8 21.2086 8.63 21.8086 9.4 21.8086H20.6C21.37 21.8086 22 21.2086 22 20.4753V12.4753C22 11.7419 21.37 11.1419 20.6 11.1419H18.381L17.1 9.80859ZM15 14.4753C16.155 14.4753 17.1 15.3753 17.1 16.4753C17.1 17.5753 16.155 18.4753 15 18.4753C13.845 18.4753 12.9 17.5753 12.9 16.4753C12.9 15.3753 13.845 14.4753 15 14.4753ZM15 13.1419C13.068 13.1419 11.5 14.6353 11.5 16.4753C11.5 18.3153 13.068 19.8086 15 19.8086C16.932 19.8086 18.5 18.3153 18.5 16.4753C18.5 14.6353 16.932 13.1419 15 13.1419Z"
							fill="white"
						/>
					</svg>
				</div>
			</label>
		</div>
	</div>

	<div class="mt-8">
		<p class="ml-1 font-semibold">이름</p>

		<div class="mt-2">
			<input
				type="text"
				bind:value={form.name}
				class="input input-bordered focus:border-primary h-[52px] w-full focus:outline-none"
			/>
		</div>
	</div>

	<div class="mt-8">
		<div class="flex items-center justify-between">
			<p class="ml-1 font-semibold">소개글</p>
			<p class="text-xs text-gray-500">
				{form.self_introduction.length}/200
			</p>
		</div>

		<div class="mt-2">
			<textarea
				class="textarea focus:border-primary w-full focus:outline-none"
				rows="4"
				maxlength="200"
				bind:value={form.self_introduction}
				placeholder="자기소개를 입력하세요 (최대 200자)"
			></textarea>
		</div>
	</div>
</main>

<div class="fixed bottom-0 w-full max-w-screen-md bg-white p-4">
	<div class="pb-safe">
		<button
			class="btn btn-primary w-full"
			onclick={handle_submit}
			disabled={is_submitting}
		>
			{is_submitting ? '저장 중...' : '저장'}
		</button>
	</div>
</div>
