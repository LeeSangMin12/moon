<script>
	let { data = $bindable() } = $props();

	let birth_input = $state('');
	let birth_error = $state('');

	// 숫자만 입력받아 자동 포맷팅 (YYYY-MM-DD)
	const handle_birth_input = (e) => {
		let value = e.target.value.replace(/\D/g, ''); // 숫자만 추출

		// 최대 8자리
		if (value.length > 8) value = value.slice(0, 8);

		// 자동 하이픈 추가
		if (value.length >= 5) {
			value = value.slice(0, 4) + '-' + value.slice(4);
		}
		if (value.length >= 8) {
			value = value.slice(0, 7) + '-' + value.slice(7);
		}

		birth_input = value;

		// 8자리 완성 시 검증
		if (value.replace(/-/g, '').length === 8) {
			validate_birth_date(value);
		} else {
			birth_error = '';
			data.birth_date = '';
		}
	};

	const validate_birth_date = (value) => {
		const date = new Date(value);
		const year = parseInt(value.slice(0, 4));
		const month = parseInt(value.slice(5, 7));
		const day = parseInt(value.slice(8, 10));
		const now = new Date();
		const current_year = now.getFullYear();

		// 유효한 날짜인지 확인
		if (isNaN(date.getTime())) {
			birth_error = '올바른 날짜를 입력해주세요';
			data.birth_date = '';
			return;
		}

		// 월 범위 (1-12)
		if (month < 1 || month > 12) {
			birth_error = '월은 1~12 사이여야 합니다';
			data.birth_date = '';
			return;
		}

		// 일 범위
		const days_in_month = new Date(year, month, 0).getDate();
		if (day < 1 || day > days_in_month) {
			birth_error = `${month}월은 ${days_in_month}일까지 있습니다`;
			data.birth_date = '';
			return;
		}

		// 연도 범위 (1900 ~ 현재년도 - 10살)
		if (year < 1900 || year > current_year - 10) {
			birth_error = `${1900}~${current_year - 10}년 사이로 입력해주세요`;
			data.birth_date = '';
			return;
		}

		// 미래 날짜 체크
		if (date > now) {
			birth_error = '미래 날짜는 입력할 수 없습니다';
			data.birth_date = '';
			return;
		}

		birth_error = '';
		data.birth_date = value;
	};
</script>

<div class="mx-4 mt-8">
	<p class="ml-1 font-semibold">성별</p>

	<div class="mt-2 flex gap-4">
		<button
			onclick={() => (data.gender = data.gender === '남자' ? '' : '남자')}
			class={`btn border-none ${data.gender === '남자' ? 'btn-primary' : 'bg-gray-100'}`}
		>
			남자
		</button>

		<button
			onclick={() => (data.gender = data.gender === '여자' ? '' : '여자')}
			class={`btn border-none ${data.gender === '여자' ? 'btn-primary' : 'bg-gray-100'}`}
		>
			여자
		</button>
	</div>
</div>

<div class="mx-4 mt-8">
	<p class="ml-1 font-semibold">생년월일</p>

	<div class="mt-2">
		<input
			type="text"
			inputmode="numeric"
			placeholder="2000-09-20"
			value={birth_input}
			oninput={handle_birth_input}
			maxlength="10"
			class="input input-bordered h-[52px] w-full focus:outline-none
				{birth_error ? 'border-red-500 focus:border-red-500' : 'focus:border-primary'}"
		/>
		{#if birth_error}
			<p class="mt-1 ml-1 text-sm text-red-500">{birth_error}</p>
		{/if}
	</div>
</div>
