<script>
	import five_thousand_coupon_popup from '$lib/img/common/popup/5,000_coupon.png';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';

	// 쿠폰 코드와 이동 경로 (필요시 수정 가능)
	const COUPON_EVENT_URL = '/event/5,000_coupon';
	const STORAGE_KEY = 'coupon_popup_hidden_until';
	const HIDE_DURATION_DAYS = 7;

	let show_popup = $state(false);

	onMount(() => {
		// 로컬스토리지에서 숨김 기한 확인
		const hidden_until = localStorage.getItem(STORAGE_KEY);

		if (hidden_until) {
			const hidden_date = new Date(hidden_until);
			const now = new Date();

			// 숨김 기한이 지났으면 팝업 표시
			if (now > hidden_date) {
				show_popup = true;
			}
		} else {
			// 처음 방문이면 팝업 표시
			show_popup = true;
		}
	});

	// 팝업 닫기
	const close_popup = () => {
		show_popup = false;
	};

	// 일주일간 보지 않기
	const hide_for_week = () => {
		const hide_until = new Date();
		hide_until.setDate(hide_until.getDate() + HIDE_DURATION_DAYS);
		localStorage.setItem(STORAGE_KEY, hide_until.toISOString());
		show_popup = false;
	};

	// 쿠폰 받으러 가기
	const go_to_coupon = () => {
		show_popup = false;
		goto('/event/5,000_coupon');
	};

	// 배경 클릭 시 닫기
	const handle_backdrop_click = (e) => {
		if (e.target === e.currentTarget) {
			close_popup();
		}
	};
</script>

{#if show_popup}
	<!-- Backdrop -->
	<div
		class="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
		onclick={handle_backdrop_click}
		role="dialog"
		aria-modal="true"
		aria-labelledby="coupon-popup-title"
	>
		<!-- Popup Container -->
		<div
			class="animate-slide-up mx-auto w-full max-w-md overflow-hidden rounded-t-2xl bg-white shadow-2xl"
			onclick={(e) => e.stopPropagation()}
		>
			<!-- 배너 이미지 -->
			<img
				src={five_thousand_coupon_popup}
				alt="5,000원 쿠폰 오직 신규 가입자만"
				class=" w-full object-cover"
			/>

			<!-- 이벤트 바로가기 버튼 -->
			<button
				onclick={go_to_coupon}
				class="flex h-12 w-full items-center justify-center rounded-none bg-[#237bf8] hover:opacity-80"
			>
				<p class="pr-2 font-semibold text-white">문 쿠폰 받으러가기</p>
				<svg
					width="7"
					height="12"
					viewBox="0 0 7 12"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
				>
					<path
						d="M0.999837 1.33203L5.6665 5.9987L0.999837 10.6654"
						stroke="white"
						stroke-width="1.33333"
						stroke-linecap="round"
						stroke-linejoin="round"
					/>
				</svg>
			</button>

			<!-- 하단 버튼들 -->
			<div class="flex items-center justify-between px-3 py-3">
				<button
					onclick={hide_for_week}
					class="text-sm text-gray-800 hover:text-gray-600"
				>
					일주일간 보지않기
				</button>
				<button onclick={close_popup} class="text-sm hover:text-gray-600">
					닫기
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	@keyframes slide-up {
		from {
			transform: translateY(100%);
		}
		to {
			transform: translateY(0);
		}
	}

	.animate-slide-up {
		animation: slide-up 0.3s ease-out;
	}
</style>
