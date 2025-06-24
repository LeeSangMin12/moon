<script>
	export let data;
	export let handle_error;

	const validate_handle = (value) => {
		const regex = /^[a-zA-Z0-9._]+$/;
		if (!regex.test(value)) {
			handle_error = true;
		} else {
			handle_error = false;
		}
	};
</script>

<div class="mx-4 mt-8">
	<p class="ml-1 font-semibold">전화번호</p>

	<div class="mt-2">
		<input
			type="text"
			bind:value={data.phone}
			class="input input-bordered focus:border-primary h-[52px] w-full focus:outline-none"
		/>
	</div>
</div>

<div class="mx-4 mt-8">
	<p class="ml-1 font-semibold">성명</p>

	<div class="mt-2">
		<input
			type="text"
			bind:value={data.name}
			class="input input-bordered focus:border-primary h-[52px] w-full focus:outline-none"
		/>
	</div>
</div>

<div class="mx-4 mt-8">
	<p class="ml-1 font-semibold">사용자이름</p>

	<div class="mt-2">
		<input
			type="text"
			bind:value={data.handle}
			oninput={() => validate_handle(data.handle)}
			class="input input-bordered focus:border-primary h-[52px] w-full focus:outline-none"
		/>
	</div>

	{#if handle_error}
		<p class="mt-1 text-sm text-red-500">
			사용자 이름에는 영어, 숫자, 밑줄(_), 마침표(.)만 사용할 수 있습니다.
		</p>
	{/if}
</div>
