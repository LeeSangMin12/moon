<script>
	import { PUBLIC_SUPABASE_URL } from '$env/static/public';
	import logo_png from '$lib/img/logo.png';

	import { show_toast } from '$lib/utils/common';
	import { update_global_store } from '$lib/store/global_store.js';

	export let avatar_url;

	const modify_avatar_url = async (event) => {
		const selected_img = event.target.files[0];
		selected_img.uri = URL.createObjectURL(selected_img);

		avatar_url = selected_img;
	};
</script>

<div class="mx-4 mt-8">
	<p class="ml-1 font-semibold">커뮤니티 프로필 사진 추가 (선택)</p>

	<div class="mt-10 flex justify-center">
		<div class="flex items-center justify-center">
			<label for="input-file">
				<input
					type="file"
					id="input-file"
					accept="image/*"
					class="hidden"
					onchange={modify_avatar_url}
				/>
				<div class="avatar relative">
					<div class="w-24 rounded-full">
						{#if avatar_url}
							<img
								src={avatar_url.uri ?? avatar_url}
								alt="커뮤니티 프로필 사진"
								loading="eager"
								width="96"
								height="96"
							/>
						{:else}
							<img
								src={logo_png}
								alt="기본 커뮤니티 프로필 사진"
								loading="eager"
								width="96"
								height="96"
							/>
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
</div>
