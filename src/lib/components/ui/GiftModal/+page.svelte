<script>
	import { createEventDispatcher } from 'svelte';
	import { RiCloseLine, RiMoonFill } from 'svelte-remixicon';

	import Modal from '$lib/components/ui/Modal/+page.svelte';

	import colors from '$lib/js/colors';
	import { comma, show_toast } from '$lib/js/common';
	import { api_store } from '$lib/store/api_store';
	import { update_user_store, user_store } from '$lib/store/user_store';

	let { is_modal_open, receiver_id, receiver_name, post_id } = $props();

	const dispatch = createEventDispatcher();

	let charge_moon_form_data = $state({
		point: 10,
		bank: '',
		account_number: '',
		account_holder: '',
	});

	let gift_moon_point = $state(10);
	let gift_content = $state('');
	let is_buy_moon_modal_open = $state(false);

	const handle_gift = async () => {
		if (gift_moon_point > $user_store.moon_point) {
			show_toast('error', '보유 문이 부족합니다.');
			return;
		}

		try {
			await $api_store.users.gift_moon(
				$user_store.id,
				receiver_id,
				gift_moon_point,
			);

			// 이벤트로 상위 컴포넌트에 알림
			dispatch('gift_success', {
				gift_content,
				gift_moon_point,
				post_id,
			});

			update_user_store({
				moon_point: $user_store.moon_point - gift_moon_point,
			});

			is_modal_open = false;
			gift_moon_point = 10;
			gift_content = '';

			show_toast('success', '성공적으로 선물을 보냈습니다.');
		} catch (e) {
			show_toast('error', e.message);
			console.error(e);
		}
	};

	const handle_charge_moon = async () => {
		// 입력 값 검증
		if (!charge_moon_form_data.point || charge_moon_form_data.point <= 0) {
			show_toast('error', '충전할 문 개수를 입력해주세요.');
			return;
		}

		if (!charge_moon_form_data.account_holder.trim()) {
			show_toast('error', '입금자명을 입력해주세요.');
			return;
		}

		if (!charge_moon_form_data.bank.trim()) {
			show_toast('error', '은행명을 입력해주세요.');
			return;
		}

		if (!charge_moon_form_data.account_number.trim()) {
			show_toast('error', '계좌번호를 입력해주세요.');
			return;
		}

		try {
			const charge_amount = Math.floor(charge_moon_form_data.point * 100 * 1.1);

			await $api_store.moon_charges.create_charge_request({
				user_id: $user_store.id,
				point: charge_moon_form_data.point,
				amount: charge_amount,
				bank: charge_moon_form_data.bank,
				account_number: charge_moon_form_data.account_number,
				account_holder: charge_moon_form_data.account_holder,
			});

			// 폼 초기화
			charge_moon_form_data = {
				point: 10,
				bank: '',
				account_number: '',
				account_holder: '',
			};

			is_buy_moon_modal_open = false;
			show_toast(
				'success',
				'충전 요청이 완료되었습니다. 관리자 승인 후 문이 충전됩니다.',
			);
		} catch (e) {
			show_toast('error', e.message);
			console.error(e);
		}
	};
</script>

<Modal bind:is_modal_open modal_position="center">
	<div class="p-4">
		<div class="flex justify-between">
			<h3 class="font-semibold">
				{receiver_name}님께 선물하기
			</h3>
			<button onclick={() => (is_modal_open = false)}>
				<RiCloseLine size={24} color={colors.gray[400]} />
			</button>
		</div>

		<div class="mt-6">
			<p class="flex gap-1 font-semibold">
				선물할 문
				<RiMoonFill size={16} color={colors.primary} />
			</p>
			<input
				type="number"
				bind:value={gift_moon_point}
				min={1}
				defaultValue={10}
				class="input mt-4 w-full border-none bg-gray-100 text-sm focus:outline-none"
			/>
			<div class="mt-2 flex gap-2">
				<button
					onclick={() => (gift_moon_point = gift_moon_point + 1)}
					class="btn btn-sm rounded-full">+1</button
				>
				<button
					onclick={() => (gift_moon_point = gift_moon_point + 10)}
					class="btn btn-sm rounded-full">+10</button
				>
				<button
					onclick={() => (gift_moon_point = gift_moon_point + 100)}
					class="btn btn-sm rounded-full">+100</button
				>
				<button
					onclick={() => (gift_moon_point = gift_moon_point + 1000)}
					class="btn btn-sm rounded-full">+1,000</button
				>
				<button
					onclick={() => (gift_moon_point = gift_moon_point + 10000)}
					class="btn btn-sm rounded-full">+10,000</button
				>
			</div>
		</div>

		<textarea
			bind:value={gift_content}
			rows="1"
			placeholder="선물 메시지를 입력하세요"
			class="mt-6 w-full resize-none rounded-sm bg-gray-100 p-2 text-sm transition-all focus:outline-none"
			style="overflow-y: hidden;"
		></textarea>

		<div class="my-4 flex items-center justify-between text-sm">
			<p>
				보유 문
				<span class="text-primary">{$user_store.moon_point ?? 0}개</span>
			</p>
			<button
				onclick={() => {
					is_modal_open = false;
					is_buy_moon_modal_open = true;
				}}
				class="btn btn-primary btn-outline-none btn-sm"
			>
				충전
			</button>
		</div>

		<div class="mt-4 flex justify-center gap-4">
			<button onclick={() => (is_modal_open = false)} class="btn flex-1"
				>닫기</button
			>
			<button
				class="btn btn-primary flex-1"
				disabled={gift_moon_point === 0 || gift_moon_point === null}
				onclick={handle_gift}>선물하기</button
			>
		</div>
	</div>
</Modal>

<Modal bind:is_modal_open={is_buy_moon_modal_open} modal_position="center">
	<div class="p-4">
		<div class="flex justify-between">
			<h3 class="font-semibold">문 충전하기</h3>
			<button onclick={() => (is_buy_moon_modal_open = false)}>
				<RiCloseLine size={24} color={colors.gray[400]} />
			</button>
		</div>

		<div class="mt-6">
			<p class="flex gap-1 font-semibold">
				충전할 문
				<RiMoonFill size={16} color={colors.primary} />
			</p>
			<input
				type="number"
				bind:value={charge_moon_form_data.point}
				min={1}
				defaultValue={10}
				class="input mt-4 w-full border-none bg-gray-100 text-sm focus:outline-none"
			/>
			<div class="mt-2 flex gap-2">
				<button
					class="btn btn-sm rounded-full"
					onclick={() =>
						(charge_moon_form_data.point = charge_moon_form_data.point + 1)}
					>+1</button
				>
				<button
					class="btn btn-sm rounded-full"
					onclick={() =>
						(charge_moon_form_data.point = charge_moon_form_data.point + 10)}
					>+10</button
				>
				<button
					class="btn btn-sm rounded-full"
					onclick={() =>
						(charge_moon_form_data.point = charge_moon_form_data.point + 100)}
					>+100</button
				>
				<button
					class="btn btn-sm rounded-full"
					onclick={() =>
						(charge_moon_form_data.point = charge_moon_form_data.point + 1000)}
					>+1,000</button
				>
				<button
					class="btn btn-sm rounded-full"
					onclick={() =>
						(charge_moon_form_data.point = charge_moon_form_data.point + 10000)}
					>+10,000</button
				>
			</div>
		</div>

		<div class="mt-6">
			<p class="text-sm font-medium">입금자명</p>
			<input
				type="text"
				bind:value={charge_moon_form_data.account_holder}
				class="mt-2 w-full rounded-sm bg-gray-100 p-2 text-sm transition-all focus:outline-none"
			/>
		</div>

		<div class="mt-4">
			<p class="text-sm font-medium">은행</p>
			<input
				type="text"
				bind:value={charge_moon_form_data.bank}
				class="mt-2 w-full rounded-sm bg-gray-100 p-2 text-sm transition-all focus:outline-none"
			/>
		</div>

		<div class="mt-4">
			<p class="text-sm font-medium">계좌번호</p>
			<input
				type="text"
				bind:value={charge_moon_form_data.account_number}
				class="mt-2 w-full rounded-sm bg-gray-100 p-2 text-sm transition-all focus:outline-none"
			/>
		</div>

		<div class="my-4 h-px bg-gray-200"></div>

		<div>
			<div class="flex justify-between">
				<p class="font-semibold">총 결제 금액</p>
				<p class="text-primary text-lg font-bold">
					{comma(Math.floor(charge_moon_form_data.point * 100 * 1.1))}원
				</p>
			</div>
		</div>

		<div
			class="font-semibod mt-2 flex flex-col justify-center bg-gray-50 px-4 py-2 text-sm text-gray-900"
		>
			<p>
				아직은 계좌이체만 지원되고 있어요!<br />
				더 편리한 결제를 위해 다양한 수단을 준비 중이니 조금만 기다려주세요 😊
			</p>
		</div>

		<button
			class="btn btn-primary mt-4 w-full rounded-lg"
			onclick={handle_charge_moon}
		>
			문 충전하기
		</button>
	</div>
</Modal>
