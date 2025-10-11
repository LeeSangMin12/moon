<script>
	export let selected_date;

	let current_date = new Date();
	current_date.setHours(0, 0, 0, 0);

	let selected_month = current_date.getMonth();
	let selected_year = current_date.getFullYear();

	let view_mode = 'days'; // 'days', 'months', 'years'

	$: calendar_days = generate_calendar(selected_month, selected_year);

	$: {
		if (selected_date) {
			calendar_days = generate_calendar(selected_month, selected_year);
		}
	}

	const days_of_week = ['일', '월', '화', '수', '목', '금', '토'];
	const months = [
		'1월',
		'2월',
		'3월',
		'4월',
		'5월',
		'6월',
		'7월',
		'8월',
		'9월',
		'10월',
		'11월',
		'12월',
	];

	function generate_calendar(month, year) {
		const first_day = new Date(year, month, 1);
		const last_day = new Date(year, month + 1, 0);
		const days = [];

		// Add empty slots for days before the first day of the month
		for (let i = 0; i < first_day.getDay(); i++) {
			days.push(null);
		}

		// Add the days of the month
		for (let i = 1; i <= last_day.getDate(); i++) {
			days.push(new Date(year, month, i));
		}

		return days;
	}

	function select_date(date) {
		if (!date || is_before_today(date)) return;
		selected_date = date;
		calendar_days = generate_calendar(selected_month, selected_year);
	}

	function change_month(delta) {
		selected_month += delta;
		if (selected_month > 11) {
			selected_month = 0;
			selected_year++;
		} else if (selected_month < 0) {
			selected_month = 11;
			selected_year--;
		}
	}

	function change_year(delta) {
		selected_year += delta;
	}

	const is_selected = (date) => {
		if (!date || !selected_date) return false;
		return date.toDateString() === selected_date.toDateString();
	};

	const is_today = (date) => {
		if (!date) return false;
		return date.toDateString() === current_date.toDateString();
	};

	const is_before_today = (date) => {
		if (!date) return false;
		return date < new Date(current_date.setHours(0, 0, 0, 0));
	};

	const set_view_mode = (mode) => {
		view_mode = mode;
	};

	const select_month = (month) => {
		selected_month = month;
		set_view_mode('days');
	};

	const select_year = (year) => {
		selected_year = year;
		set_view_mode('months');
	};
</script>

<div class="header flex items-center justify-between">
	{#if view_mode === 'days'}
		<button
			class="flex cursor-pointer font-semibold"
			onclick={() => set_view_mode('months')}
			>{selected_year}.{String(selected_month + 1).padStart(2, '0')}
			<svg
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					fill-rule="evenodd"
					clip-rule="evenodd"
					d="M8.76092 17.65C8.2915 17.1821 8.29022 16.4223 8.75805 15.9529L12.6976 12L8.75805 8.04709C8.29022 7.57767 8.2915 6.81787 8.76092 6.35004C9.23034 5.8822 9.99014 5.88349 10.458 6.35291L15.2418 11.1529C15.7085 11.6212 15.7085 12.3788 15.2418 12.8471L10.458 17.6471C9.99014 18.1165 9.23034 18.1178 8.76092 17.65Z"
					fill="#9CA0A9"
				/>
			</svg>
		</button>
		<div class="flex">
			<button onclick={() => change_month(-1)} class="mr-4">
				<svg
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<rect width="24" height="24" fill="white" />
					<path
						d="M15 5L8 12L15 19"
						stroke="#9CA0A9"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			</button>

			<button onclick={() => change_month(1)}>
				<svg
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<rect
						width="24"
						height="24"
						transform="matrix(-1 0 0 1 24 0)"
						fill="white"
					/>
					<path
						d="M9 5L16 12L9 19"
						stroke="#9CA0A9"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			</button>
		</div>
	{:else if view_mode === 'months'}
		<button
			class="flex cursor-pointer font-semibold"
			onclick={() => set_view_mode('years')}
			>{selected_year}
			<svg
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					fill-rule="evenodd"
					clip-rule="evenodd"
					d="M8.76092 17.65C8.2915 17.1821 8.29022 16.4223 8.75805 15.9529L12.6976 12L8.75805 8.04709C8.29022 7.57767 8.2915 6.81787 8.76092 6.35004C9.23034 5.8822 9.99014 5.88349 10.458 6.35291L15.2418 11.1529C15.7085 11.6212 15.7085 12.3788 15.2418 12.8471L10.458 17.6471C9.99014 18.1165 9.23034 18.1178 8.76092 17.65Z"
					fill="#9CA0A9"
				/>
			</svg>
		</button>
		<div class="flex">
			<button onclick={() => change_year(-1)} class="mr-4">
				<svg
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<rect width="24" height="24" fill="white" />
					<path
						d="M15 5L8 12L15 19"
						stroke="#9CA0A9"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			</button>

			<button onclick={() => change_year(1)}>
				<svg
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<rect
						width="24"
						height="24"
						transform="matrix(-1 0 0 1 24 0)"
						fill="white"
					/>
					<path
						d="M9 5L16 12L9 19"
						stroke="#9CA0A9"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			</button>
		</div>
	{:else}
		<button
			class="flex cursor-pointer font-semibold"
			onclick={() => set_view_mode('years')}
			>{selected_year - 6} - {selected_year + 5}
			<svg
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
			>
				<path
					fill-rule="evenodd"
					clip-rule="evenodd"
					d="M8.76092 17.65C8.2915 17.1821 8.29022 16.4223 8.75805 15.9529L12.6976 12L8.75805 8.04709C8.29022 7.57767 8.2915 6.81787 8.76092 6.35004C9.23034 5.8822 9.99014 5.88349 10.458 6.35291L15.2418 11.1529C15.7085 11.6212 15.7085 12.3788 15.2418 12.8471L10.458 17.6471C9.99014 18.1165 9.23034 18.1178 8.76092 17.65Z"
					fill="#9CA0A9"
				/>
			</svg>
		</button>
		<div class="flex">
			<button onclick={() => change_year(-12)} class="mr-4">
				<svg
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<rect width="24" height="24" fill="white" />
					<path
						d="M15 5L8 12L15 19"
						stroke="#9CA0A9"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			</button>

			<button onclick={() => change_year(12)}>
				<svg
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<rect
						width="24"
						height="24"
						transform="matrix(-1 0 0 1 24 0)"
						fill="white"
					/>
					<path
						d="M9 5L16 12L9 19"
						stroke="#9CA0A9"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			</button>
		</div>
	{/if}
</div>

<div class="mt-4">
	{#if view_mode === 'days'}
		<div class="calendar grid grid-cols-7">
			{#each days_of_week as day}
				<div
					class={`relative text-center text-sm ${day === '토' ? 'text-primary' : day === '일' ? 'text-error' : ''}`}
				>
					{day}
				</div>
			{/each}

			{#each calendar_days as date, index}
				{#if date}
					<button
						onclick={() => select_date(date)}
						class="relative py-2.5 text-sm {index % 7 === 0
							? 'text-red-500'
							: index % 7 === 6
								? 'text-blue-500'
								: ''}
								{is_before_today(date)
							? 'cursor-not-allowed !text-gray-300'
							: is_selected(date)
								? 'bg-primary rounded-full !text-white'
								: 'hover:bg-gray-200'} "
						disabled={is_before_today(date)}
					>
						{date.getDate()}

						{#if !is_selected(date) && is_today(date)}
							<div
								class="border-primary absolute bottom-0 left-1 h-10 w-10 rounded-full border-2"
							></div>
						{/if}
					</button>
				{:else}
					<div></div>
				{/if}
			{/each}
		</div>
	{:else if view_mode === 'months'}
		<div class="grid grid-cols-3 gap-2">
			{#each months as month, index}
				<button
					class="h-11 rounded text-sm {selected_month === index
						? 'bg-blue-500 text-white'
						: 'bg-gray-50 hover:bg-gray-200'}"
					onclick={() => select_month(index)}
				>
					{month}
				</button>
			{/each}
		</div>
	{:else}
		<div class="grid grid-cols-3 gap-2">
			{#each Array(12) as _, i}
				<button
					class="h-11 rounded {selected_year === selected_year - 6 + i
						? 'bg-blue-500 text-white'
						: 'bg-gray-50 hover:bg-gray-200'}"
					onclick={() => select_year(selected_year - 6 + i)}
				>
					{selected_year - 6 + i}
				</button>
			{/each}
		</div>
	{/if}
</div>
