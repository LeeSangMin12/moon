<script>
	export let title;
	export let content;
	export let slug;
	export let is_edit_mode;
	let slug_error = false;

	let validate_slug = (value) => {
		const regex = /^[a-zA-Z0-9-]+$/;
		if (!regex.test(value)) {
			slug_error = true;
		} else {
			slug_error = false;
		}
	};
</script>

<section class="mx-4">
	<div class="mt-4">
		<p class="ml-1 text-sm font-semibold">커뮤니티 제목</p>

		<div class="mt-2">
			<input
				type="text"
				placeholder="커뮤니티 제목을 입력해주세요."
				class="input input-bordered focus:border-primary h-[52px] w-full focus:outline-none"
				bind:value={title}
			/>
		</div>
	</div>

	<div class="mt-4">
		<p class="ml-1 text-sm font-semibold">커뮤니티 url 주소</p>

		<div class="mt-2">
			<input
				type="text"
				disabled={is_edit_mode}
				placeholder="(영문, 숫자, 하이픈만 사용 가능) 예시: chatgpt-study"
				oninput={() => validate_slug(slug)}
				class="input input-bordered focus:border-primary h-[52px] w-full focus:outline-none"
				bind:value={slug}
			/>
		</div>
	</div>

	{#if slug_error}
		<p class="mt-1 text-sm text-red-500">
			커뮤니티 url 주소에는 영문, 숫자, 하이픈만 사용할 수 있습니다.
		</p>
	{/if}

	<div class="mt-6 flex flex-col">
		<p class="ml-1 text-sm font-semibold">커뮤니티 내용</p>

		<div class="mt-2">
			<textarea
				type="text"
				class="textarea input input-bordered focus:border-primary h-40 w-full focus:outline-none"
				placeholder="커뮤니티에 대한 상세한 설명을 입력해주세요."
				bind:value={content}
			></textarea>
		</div>
	</div>
</section>
