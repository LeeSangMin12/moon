<script>
	export let data;
</script>

<div class="mx-4 mt-8">
	<p class="ml-1 font-semibold">성별</p>

	<div class="mt-2 flex gap-4">
		<button
			onclick={() => (data.gender = data.gender === '남자' ? '' : '남자')}
			class={`btn   border-none ${data.gender === '남자' ? 'btn-primary' : 'bg-gray-100'}`}
			>남자
		</button>

		<button
			onclick={() => (data.gender = data.gender === '여자' ? '' : '여자')}
			class={`btn border-none ${data.gender === '여자' ? 'btn-primary' : 'bg-gray-100'}`}
			>여자
		</button>
	</div>
</div>

<div class="mx-4 mt-8">
	<p class="ml-1 font-semibold">생년월일</p>

	<div class="mt-2">
		<input
			type="date"
			bind:value={data.birth_date}
			class="input input-bordered focus:border-primary h-[52px] w-full focus:outline-none"
		/>
	</div>
</div>
