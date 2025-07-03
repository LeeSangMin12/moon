<script>
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { RiArrowLeftSLine } from 'svelte-remixicon';

	import Header from '$lib/components/ui/Header/+page.svelte';
	import Modal from '$lib/components/ui/Modal/+page.svelte';

	import colors from '$lib/js/colors';
	import { comma, format_date, show_toast } from '$lib/js/common';
	import { api_store } from '$lib/store/api_store';
	import { user_store } from '$lib/store/user_store';

	const TITLE = '포인트';

	const typeMap = {
		charge: { label: '문 충전', icon: '💰' },
		gift: { label: '문 선물', icon: '🎁' },
		receive: { label: '문 선물 받음', icon: '🎉' },
		use: { label: '문 사용', icon: '🛒' },
		withdrawal: { label: '문 출금', icon: '💰' },
	};

	let { data } = $props();
	let { moon_point_transactions, moon_withdrawals } = $state(data);

	let is_withdraw_modal_open = $state(false);
	let withdraw_form = $state({
		amount: $user_store.moon_point,
		bank: '',
		account_number: '',
		account_holder: '',
	});
	let withdraw_loading = $state(false);

	function getWithdrawAmount(point) {
		const 원화 = point * 100;
		const 수수료 = Math.floor(원화 * 0.1);
		const 실지급액 = 원화 - 수수료;
		return { 원화, 수수료, 실지급액 };
	}

	async function handle_withdraw() {
		if (!withdraw_form.amount || withdraw_form.amount <= 0) {
			alert('출금할 금액을 입력하세요.');
			return;
		}
		if (
			!withdraw_form.bank.trim() ||
			!withdraw_form.account_number.trim() ||
			!withdraw_form.account_holder.trim()
		) {
			alert('은행, 계좌번호, 예금주를 모두 입력하세요.');
			return;
		}

		if ($user_store.moon_point < withdraw_form.amount) {
			alert('보유 문이 부족합니다.');
			return;
		}

		withdraw_loading = true;
		try {
			const { error } = await $api_store.moon_withdrawals.insert({
				user_id: $user_store.id,
				amount: withdraw_form.amount,
				bank: withdraw_form.bank,
				account_number: withdraw_form.account_number,
				account_holder: withdraw_form.account_holder,
			});
			if (error) throw error;
			alert('출금 신청이 완료되었습니다!');
			is_withdraw_modal_open = false;
			moon_withdrawals = await $api_store.moon_withdrawals.select_by_user_id(
				$user_store.id,
			);

			// 필요시 출금 내역 새로고침 등
		} catch (e) {
			alert(e.message);
		} finally {
			withdraw_loading = false;
		}
	}
</script>

<Header nav_class="bg-white">
	<div slot="left">
		<a href={`/@${$user_store.handle}/accounts`}>
			<RiArrowLeftSLine size={24} color={colors.gray[600]} />
		</a>
	</div>
	<h1 slot="center" class="text-xl font-bold text-gray-800">{TITLE}</h1>
</Header>

<main>
	<div class="mx-5 mt-7">
		<div class="flex items-center">
			<div
				class="bg-primary mr-2 flex h-5 w-5 items-center justify-center rounded-full"
			>
				<svg
					width="10"
					height="7"
					viewBox="0 0 10 7"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M3.38505 6.90608C2.98019 6.90608 2.62849 6.62763 2.53562 6.23357L2.09693 4.37208C2.03485 4.10867 1.79976 3.92255 1.52914 3.92255H1.40188C1.15 3.92255 0.945801 3.71835 0.945801 3.46647V3.37566C0.945801 3.17393 1.10934 3.01039 1.31108 3.01039V3.01039C1.54668 3.01039 1.72066 2.79064 1.66662 2.56132L1.25221 0.802884C1.15882 0.406598 1.45947 0.0268555 1.86661 0.0268555V0.0268555C2.16591 0.0268555 2.42407 0.237045 2.48474 0.530132L2.90373 2.55421C2.95873 2.81987 3.19272 3.01039 3.46402 3.01039V3.01039C3.73074 3.01039 3.96209 2.82608 4.0217 2.5661L4.46698 0.624212C4.54713 0.274656 4.85818 0.0268555 5.21681 0.0268555V0.0268555C5.57544 0.0268555 5.88649 0.274656 5.96664 0.624212L6.41147 2.56416C6.47135 2.82528 6.7037 3.01039 6.97159 3.01039V3.01039C7.2444 3.01039 7.4796 2.81858 7.5345 2.55136L7.94955 0.530768C8.00981 0.237414 8.26802 0.0268555 8.5675 0.0268555V0.0268555C8.97439 0.0268555 9.27486 0.406365 9.18152 0.802409L8.767 2.56132C8.71296 2.79064 8.88694 3.01039 9.12254 3.01039V3.01039C9.32428 3.01039 9.48782 3.17393 9.48782 3.37566V3.46647C9.48782 3.71835 9.28363 3.92255 9.03174 3.92255H8.90448C8.63386 3.92255 8.39877 4.10867 8.33669 4.37208L7.898 6.23357C7.80513 6.62763 7.45343 6.90608 7.04858 6.90608V6.90608C6.64125 6.90608 6.2881 6.6243 6.19766 6.22714L5.77415 4.36725C5.71492 4.10711 5.48361 3.92255 5.21681 3.92255V3.92255C4.95002 3.92255 4.7187 4.10711 4.65947 4.36725L4.23596 6.22714C4.14552 6.6243 3.79237 6.90608 3.38505 6.90608V6.90608ZM3.44427 3.92255C3.30973 3.92255 3.20916 4.04618 3.23655 4.17791L3.40087 4.96803C3.40429 4.98446 3.41877 4.99624 3.43555 4.99624V4.99624C3.45205 4.99624 3.46637 4.98484 3.47007 4.96876L3.65103 4.18228C3.68161 4.04937 3.58065 3.92255 3.44427 3.92255V3.92255ZM5.02422 2.76942C4.99631 2.89291 5.0902 3.01039 5.21681 3.01039V3.01039C5.34342 3.01039 5.43731 2.89291 5.4094 2.76942L5.2458 2.04538C5.24274 2.03183 5.2307 2.02221 5.21681 2.02221V2.02221C5.20292 2.02221 5.19088 2.03183 5.18782 2.04538L5.02422 2.76942ZM6.98933 3.92255C6.85285 3.92255 6.75174 4.04932 6.78209 4.18237L6.9636 4.97825C6.96727 4.99433 6.98157 5.00574 6.99807 5.00574V5.00574C7.01485 5.00574 7.02931 4.99395 7.0327 4.97752L7.19751 4.17802C7.22469 4.04615 7.12397 3.92255 6.98933 3.92255V3.92255Z"
						fill="white"
					/>
				</svg>
			</div>
			<p class="text-lg font-semibold">문 포인트</p>
		</div>
		<p class="mt-4 text-3xl font-bold">{comma($user_store.moon_point)}P</p>

		{#if moon_withdrawals?.status === 'pending'}
			<button class="btn btn-disabled mt-5 w-full">출금 신청 처리중</button>
		{:else}
			<button
				class="btn btn-primary mt-5 w-full"
				onclick={() => (is_withdraw_modal_open = true)}>출금하기</button
			>
		{/if}
	</div>

	<div class="mt-5 h-2 w-full bg-gray-100"></div>

	<div class="mx-5 mt-5">
		<p>적립/사용내역</p>

		{#each moon_point_transactions as history}
			<div class="mt-8">
				<p
					class="inline-block rounded-[4px] bg-gray-200 px-1 py-0.5 text-[11px]"
				>
					{typeMap[history.type].icon}
					{typeMap[history.type].label}
				</p>

				<div class="mt-2.5 flex items-center justify-between">
					<p class="mr-9 truncate">{history.description}</p>

					{#if history.amount > 0}
						<p class="text-primary flex-shrink-0 font-semibold">
							+{history.amount}P
						</p>
					{:else}
						<p class="flex-shrink-0 font-semibold text-gray-900">
							{history.amount}P
						</p>
					{/if}
				</div>

				<div class="mt-1.5 flex items-center justify-between">
					<p class="text-sm text-gray-800">{format_date(history.created_at)}</p>
					<p class="text-sm text-gray-800">{history.amount}P</p>
				</div>
			</div>
		{/each}
	</div>
</main>

<Modal bind:is_modal_open={is_withdraw_modal_open} modal_position="center">
	<div class="p-4">
		<h3 class="mb-4 font-semibold">문 포인트 출금 신청</h3>
		<div class="mt-2">
			<p class="ml-1 text-sm font-semibold">출금 금액</p>

			<div class="mt-2">
				<input
					type="number"
					min="1"
					max={$user_store.moon_point}
					bind:value={withdraw_form.amount}
					class="input input-bordered focus:border-primary h-[52px] w-full focus:outline-none"
				/>
			</div>
		</div>

		<div class="mt-4">
			<p class="ml-1 text-sm font-semibold">은행</p>

			<div class="mt-2">
				<input
					type="text"
					bind:value={withdraw_form.bank}
					placeholder="예: 국민"
					class="input input-bordered focus:border-primary h-[52px] w-full focus:outline-none"
				/>
			</div>
		</div>

		<div class="mt-4">
			<p class="ml-1 text-sm font-semibold">계좌번호</p>

			<div class="mt-2">
				<input
					type="text"
					bind:value={withdraw_form.account_number}
					placeholder="예: 1234-12-1234567890"
					class="input input-bordered focus:border-primary h-[52px] w-full focus:outline-none"
				/>
			</div>
		</div>

		<div class="mt-4">
			<p class="ml-1 text-sm font-semibold">예금주</p>

			<div class="mt-2">
				<input
					type="text"
					bind:value={withdraw_form.account_holder}
					placeholder="예: 홍길동"
					class="input input-bordered focus:border-primary h-[52px] w-full focus:outline-none"
				/>
			</div>
		</div>

		<!-- 수수료/실지급액 안내 -->
		<div
			class="mt-6 flex flex-col gap-2 rounded-xl border border-gray-100 bg-white p-4 shadow"
		>
			<div class="flex items-center justify-between">
				<span class="text-sm text-gray-500">출금 신청 문</span>
				<span class="text-base font-bold">{withdraw_form.amount}문</span>
			</div>
			<div class="flex items-center justify-between">
				<span class="text-sm text-gray-500">환산 금액</span>
				<span class="text-base font-semibold"
					>{comma(getWithdrawAmount(withdraw_form.amount).원화)}원</span
				>
			</div>
			<div class="flex items-center justify-between">
				<span class="text-sm text-gray-500"
					>수수료 <span class="text-xs">(10%)</span></span
				>
				<span class="text-base font-semibold text-red-500"
					>-{comma(getWithdrawAmount(withdraw_form.amount).수수료)}원</span
				>
			</div>
			<div class="mt-2 flex items-center justify-between border-t pt-2">
				<span class="font-semibold text-gray-700">실지급액</span>
				<span class="text-lg font-bold text-blue-600"
					>{comma(getWithdrawAmount(withdraw_form.amount).실지급액)}원</span
				>
			</div>
		</div>
		<p class="mt-2 text-center text-xs text-gray-400">
			1문 = 100원, 출금 시 10% 수수료가 차감됩니다.
		</p>

		<div class="mt-4 flex gap-2">
			<button
				class="btn flex-1"
				onclick={() => (is_withdraw_modal_open = false)}>취소</button
			>
			<button
				class="btn btn-primary flex-1"
				onclick={handle_withdraw}
				disabled={withdraw_loading}
			>
				{withdraw_loading ? '신청 중...' : '출금 신청'}
			</button>
		</div>
	</div>
</Modal>
