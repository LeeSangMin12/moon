<script>
	export let data;
	export let handle_error;
	export let email_error;

	const validate_handle = (value) => {
		const regex = /^[a-zA-Z0-9._]+$/;
		if (!regex.test(value)) {
			handle_error = true;
		} else {
			handle_error = false;
		}
	};

	const validate_email = (value) => {
		const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!regex.test(value)) {
			email_error = true;
		} else {
			email_error = false;
		}
	};
</script>

<div class="mx-4 mt-8">
	<p class="ml-1 font-semibold">이름</p>

	<div class="mt-2">
		<input
			type="text"
			placeholder="예: 홍길동"
			bind:value={data.name}
			class="input input-bordered focus:border-primary h-[52px] w-full focus:outline-none"
		/>
	</div>
</div>

<div class="mx-4 mt-8">
	<p class="ml-1 font-semibold">아이디</p>

	<div class="mt-2">
		<input
			type="text"
			placeholder="예: devsangmin32"
			bind:value={data.handle}
			oninput={() => validate_handle(data.handle)}
			class="input input-bordered focus:border-primary h-[52px] w-full focus:outline-none"
		/>
	</div>

	{#if handle_error}
		<p class="mt-1 text-sm text-red-500">
			아이디에는 영어, 숫자, 밑줄(_), 마침표(.)만 사용할 수 있습니다.
		</p>
	{/if}
</div>

<div class="mx-4 mt-8">
	<p class="ml-1 font-semibold">이메일</p>

	<div class="mt-2">
		<input
			type="email"
			placeholder="예: example@email.com"
			bind:value={data.email}
			oninput={() => validate_email(data.email)}
			class="input input-bordered focus:border-primary h-[52px] w-full focus:outline-none"
		/>
	</div>

	{#if email_error}
		<p class="mt-1 text-sm text-red-500">
			올바른 이메일 주소를 입력해주세요.
		</p>
	{/if}
</div>

<div class="mx-4 mt-8">
	<p class="ml-1 font-semibold">전화번호</p>

	<div class="mt-2">
		<input
			type="tel"
			placeholder="예: 01012345678"
			bind:value={data.phone}
			class="input input-bordered focus:border-primary h-[52px] w-full focus:outline-none"
		/>
	</div>
</div>
