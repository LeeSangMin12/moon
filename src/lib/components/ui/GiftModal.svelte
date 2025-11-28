<script>
	import {
		get_api_context,
		get_user_context,
	} from '$lib/contexts/app_context.svelte.js';
	import { comma, show_toast } from '$lib/utils/common';

	import Modal from '$lib/components/ui/Modal.svelte';

	let {
		is_modal_open = $bindable(),
		receiver_id,
		receiver_name,
		post_id,
		onGiftSuccess,
	} = $props();

	const me = get_user_context();
	const api = get_api_context();

	let gift_amount = $state(1000);
	let gift_content = $state('');
	let submitting = $state(false);

	const amounts = [1000, 5000, 10000, 50000];
	const balance = $derived(me?.moon_cash || 0);
	const is_over = $derived(gift_amount > balance);
	const can_submit = $derived(
		gift_amount >= 100 && gift_amount <= balance && !submitting,
	);

	function set_amount(val) {
		gift_amount = Math.min(val, balance);
	}

	function add_amount(val) {
		gift_amount = Math.min(gift_amount + val, balance);
	}

	const handle_gift = async () => {
		if (!can_submit) return;

		// 자기 자신에게 선물 방지
		if (me.id === receiver_id) {
			show_toast('error', '자기 자신에게는 선물할 수 없어요');
			return;
		}

		submitting = true;
		try {
			// gift_moon RPC가 잔액 이동 + 거래 기록 모두 처리
			await api.users.gift_moon(me.id, receiver_id, gift_amount);

			try {
				await api.notifications.insert({
					recipient_id: receiver_id,
					actor_id: me.id,
					type: 'gift.received',
					resource_type: 'user',
					resource_id: String(receiver_id),
					payload: { amount: gift_amount, post_id },
					link_url: `/@${me.handle}/accounts/cash`,
				});
			} catch (e) {
				console.error('Failed to insert notification:', e);
			}

			onGiftSuccess?.({
				gift_content,
				gift_amount,
				post_id,
			});

			me.moon_cash = me.moon_cash - gift_amount;

			is_modal_open = false;
			gift_amount = 1000;
			gift_content = '';

			show_toast('success', '선물을 보냈어요');
		} catch (e) {
			// 에러 메시지에서 실제 메시지 추출 (예: "Failed to gift_moon: 보유 캐시가 부족합니다.")
			const msg = e.message?.includes(':')
				? e.message.split(':').pop().trim()
				: e.message;
			show_toast('error', msg || '선물 전송에 실패했어요');
		} finally {
			submitting = false;
		}
	};

	function close() {
		is_modal_open = false;
	}
</script>

<Modal bind:is_modal_open modal_position="center">
	<div class="p-5">
		<!-- 헤더 -->
		<p class="text-[16px] font-semibold text-gray-900">
			{receiver_name}님께 선물
		</p>

		<!-- 잔액 -->
		<div
			class="mt-4 flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3"
		>
			<span class="text-[13px] text-gray-500">내 캐시</span>
			<span class="text-[15px] font-semibold text-gray-900"
				>{comma(balance)}원</span
			>
		</div>

		<!-- 금액 입력 -->
		<div class="mt-5">
			<p class="text-[13px] text-gray-500">선물 금액</p>
			<div class="relative mt-2">
				<input
					type="text"
					inputmode="numeric"
					value={gift_amount ? comma(gift_amount) : ''}
					oninput={(e) => {
						const val = e.target.value.replace(/[^0-9]/g, '');
						gift_amount = Number(val) || 0;
					}}
					placeholder="0"
					class="w-full border-0 border-b-2 bg-transparent pb-2 text-[24px] font-bold placeholder-gray-300 focus:outline-none
						{is_over
						? 'border-red-300 text-red-500 focus:border-red-500'
						: 'border-gray-200 text-gray-900 focus:border-gray-900'}"
				/>
				<span
					class="absolute right-0 bottom-2 text-[16px] font-semibold text-gray-400"
					>원</span
				>
			</div>

			{#if is_over}
				<p class="mt-2 text-[13px] text-red-500">잔액이 부족해요</p>
			{/if}

			<div class="mt-3 flex gap-2">
				{#each amounts as amt}
					<button
						onclick={() => add_amount(amt)}
						disabled={amt > balance}
						class="flex-1 rounded-lg py-2 text-[13px] font-medium
							{amt > balance
							? 'cursor-not-allowed bg-gray-50 text-gray-300'
							: 'bg-gray-100 text-gray-700 active:bg-gray-200'}"
					>
						+{comma(amt)}
					</button>
				{/each}
			</div>
		</div>

		<!-- 메시지 -->
		<div class="mt-5">
			<p class="text-[13px] text-gray-500">메시지 (선택)</p>
			<textarea
				bind:value={gift_content}
				rows="2"
				placeholder="따뜻한 메시지를 남겨보세요"
				class="mt-2 w-full resize-none rounded-lg border border-gray-200 p-3 text-[14px] text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none"
			></textarea>
		</div>

		<!-- 충전 링크 -->
		<a
			href={`/@${me?.handle}/accounts/cash/charge`}
			onclick={close}
			class="mt-4 block text-center text-[13px] text-blue-500"
		>
			캐시가 부족하신가요? 충전하기 →
		</a>

		<!-- 버튼 -->
		<div class="mt-5 flex gap-2">
			<button
				onclick={close}
				class="flex-1 rounded-lg bg-gray-100 py-3 text-[14px] font-medium text-gray-700 active:bg-gray-200"
			>
				취소
			</button>
			<button
				onclick={handle_gift}
				disabled={!can_submit}
				class="flex-1 rounded-lg bg-blue-500 py-3 text-[14px] font-medium text-white active:bg-blue-600 disabled:bg-gray-300 disabled:text-gray-500"
			>
				{submitting ? '전송 중...' : '선물하기'}
			</button>
		</div>
	</div>
</Modal>
