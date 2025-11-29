<script>
	import { get_api_context } from '$lib/contexts/app_context.svelte.js';
	import { show_toast } from '$lib/utils/common';
	import { onMount } from 'svelte';

	let { phone = $bindable(''), on_verified } = $props();

	const api = get_api_context();

	let otp = $state('');
	let is_otp_sent = $state(false);
	let countdown = $state(0);
	let is_sending = $state(false);
	let is_verifying = $state(false);
	let is_verified = $state(false);
	let phone_error = $state('');
	let retry_count = $state(0);
	const MAX_RETRIES = 5;

	let otp_input_ref;

	/**
	 * 전화번호 형식 검증
	 */
	const validate_phone = (value) => {
		// 하이픈 제거한 숫자만 체크
		const cleaned = value.replace(/-/g, '');

		// 한국 전화번호: 010으로 시작하는 11자리
		const regex = /^010\d{8}$/;

		if (!value) {
			phone_error = '';
			return false;
		}

		if (!regex.test(cleaned)) {
			phone_error = '올바른 전화번호를 입력해주세요 (예: 010-1234-5678)';
			return false;
		}

		phone_error = '';
		return true;
	};

	/**
	 * 전화번호 입력 시 자동 하이픈 추가
	 */
	const format_phone_input = (value) => {
		const cleaned = value.replace(/[^0-9]/g, '');

		if (cleaned.length <= 3) {
			return cleaned;
		} else if (cleaned.length <= 7) {
			return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
		} else {
			return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7, 11)}`;
		}
	};

	/**
	 * 전화번호 입력 핸들러
	 */
	const handle_phone_input = (event) => {
		const formatted = format_phone_input(event.target.value);
		phone = formatted;
		validate_phone(phone);
	};

	/**
	 * OTP 전송
	 */
	const send_otp = async () => {
		if (!validate_phone(phone)) {
			show_toast('error', '올바른 전화번호를 입력해주세요');
			return;
		}

		// 중복 체크
		try {
			is_sending = true;
			const international_phone = api.auth.format_to_international(phone);
			const exists = await api.auth.check_phone_exists(international_phone);

			if (exists) {
				show_toast('error', '이미 가입된 전화번호입니다');
				return;
			}

			// OTP 전송
			await api.auth.send_otp(international_phone);
			is_otp_sent = true;
			start_countdown();
			show_toast('success', '인증번호가 전송되었습니다');

			// 입력창에 포커스
			setTimeout(() => {
				otp_input_ref?.focus();
			}, 100);
		} catch (err) {
			console.error('OTP 전송 실패:', err);
			show_toast('error', '인증번호 전송에 실패했습니다');
		} finally {
			is_sending = false;
		}
	};

	/**
	 * OTP 검증
	 */
	const verify_otp = async () => {
		if (is_verified) return;

		if (otp.length !== 6) {
			show_toast('error', '인증번호 6자리를 입력해주세요');
			return;
		}

		if (retry_count >= MAX_RETRIES) {
			show_toast(
				'error',
				'인증 시도 횟수를 초과했습니다. 잠시 후 다시 시도해주세요',
			);
			return;
		}

		try {
			is_verifying = true;
			const international_phone = api.auth.format_to_international(phone);
			await api.auth.verify_otp(international_phone, otp);

			is_verified = true;
			show_toast('success', '전화번호 인증이 완료되었습니다');
			on_verified?.(international_phone);
		} catch (err) {
			console.error('OTP 검증 실패:', err);
			retry_count++;
			show_toast('error', '인증번호가 일치하지 않습니다');

			// 입력 초기화 및 포커스
			otp = '';
			setTimeout(() => {
				otp_input_ref?.focus();
			}, 100);
		} finally {
			is_verifying = false;
		}
	};

	/**
	 * 카운트다운 시작
	 */
	const start_countdown = () => {
		countdown = 180; // 3분
		const interval = setInterval(() => {
			countdown--;
			if (countdown <= 0) {
				clearInterval(interval);
			}
		}, 1000);
	};

	/**
	 * OTP 입력 핸들러
	 */
	const handle_otp_input = (event) => {
		// 숫자만 허용
		const value = event.target.value.replace(/\D/g, '').slice(0, 6);
		otp = value;

		// 6자리 입력되면 자동 검증
		if (value.length === 6) {
			verify_otp();
		}
	};

	/**
	 * 카운트다운 표시 형식 (mm:ss)
	 */
	const format_countdown = $derived(() => {
		const minutes = Math.floor(countdown / 60);
		const seconds = countdown % 60;
		return `${minutes}:${seconds.toString().padStart(2, '0')}`;
	});

	/**
	 * 다음 버튼 활성화 여부
	 */
	const is_next_disabled = $derived(!phone || !!phone_error || countdown <= 0);

	onMount(() => {
		return () => {
			// 컴포넌트 언마운트 시 타이머 정리는 자동으로 처리됨
		};
	});
</script>

<div class="mx-4 mt-8">
	<p class="ml-1 font-semibold">전화번호</p>

	<div class="mt-2 flex gap-2">
		<input
			type="tel"
			placeholder="010-1234-5678"
			bind:value={phone}
			oninput={handle_phone_input}
			disabled={is_otp_sent}
			maxlength="13"
			class="input input-bordered focus:border-primary h-[52px] flex-1 focus:outline-none disabled:bg-gray-100"
		/>
		<button
			onclick={send_otp}
			disabled={!phone || !!phone_error || countdown > 0 || is_sending}
			class="btn btn-primary h-[52px] min-w-[100px] px-4 whitespace-nowrap"
		>
			{#if is_sending}
				<span class="loading loading-spinner loading-sm"></span>
			{:else if countdown > 0}
				{format_countdown()}
			{:else}
				인증번호
			{/if}
		</button>
	</div>

	{#if phone_error}
		<p class="mt-1 text-sm text-red-500">{phone_error}</p>
	{/if}
</div>

{#if is_otp_sent}
	<div class="mx-4 mt-8">
		<p class="ml-1 font-semibold">인증번호</p>
		<p class="mt-1 ml-1 text-sm text-gray-600">
			{phone}로 전송된 6자리 인증번호를 입력해주세요
		</p>

		<div class="mt-2 flex gap-2">
			<input
				bind:this={otp_input_ref}
				type="text"
				inputmode="numeric"
				placeholder="000000"
				value={otp}
				oninput={handle_otp_input}
				disabled={is_verified}
				maxlength="6"
				class="input input-bordered focus:border-primary h-[52px] flex-1 text-center text-lg tracking-widest focus:outline-none disabled:bg-gray-100"
			/>
			<button
				onclick={verify_otp}
				disabled={otp.length !== 6 || is_verifying || is_verified}
				class="btn btn-primary h-[52px] min-w-[100px] px-4 whitespace-nowrap"
			>
				{#if is_verifying}
					<span class="loading loading-spinner loading-sm"></span>
				{:else if is_verified}
					완료
				{:else}
					인증 확인
				{/if}
			</button>
		</div>

		<div class="mt-4 flex justify-center">
			<button
				onclick={send_otp}
				disabled={countdown > 0 || is_sending || is_verified}
				class="btn btn-ghost btn-sm"
			>
				{countdown > 0 ? `재전송 (${format_countdown()})` : '인증번호 재전송'}
			</button>
		</div>

		{#if retry_count > 0}
			<p class="mt-2 text-center text-sm text-gray-600">
				{MAX_RETRIES - retry_count}회 남았습니다
			</p>
		{/if}
	</div>
{/if}
