<script>
	import colors from '$lib/config/colors';
	import {
		get_api_context,
		get_user_context,
	} from '$lib/contexts/app_context.svelte.js';
	import { show_toast } from '$lib/utils/common';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { RiArrowLeftSLine } from 'svelte-remixicon';

	import Header from '$lib/components/ui/Header.svelte';

	const me = get_user_context();
	const api = get_api_context();

	let form = $state({
		contact_phone: '',
		contact_email: '',
	});

	let phone_error = $state('');
	let email_error = $state('');
	let is_submitting = $state(false);
	let is_loading = $state(true);

	// 연락처 정보 로드
	onMount(async () => {
		if (!me?.id) {
			is_loading = false;
			return;
		}

		try {
			const contact = await api.user_contacts.select_by_user_id(me.id);
			if (contact) {
				form.contact_phone = format_to_display(contact.contact_phone);
				form.contact_email = contact.contact_email || '';
			}
		} catch (e) {
			console.error('Failed to load contact:', e);
		} finally {
			is_loading = false;
		}
	});

	// 전화번호 표시용 포맷 (010-1234-5678)
	const format_to_display = (phone) => {
		if (!phone) return '';
		// 숫자만 추출
		const cleaned = phone.replace(/[^0-9]/g, '');
		if (cleaned.length === 11) {
			return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`;
		}
		return phone;
	};

	// 전화번호 자동 포맷팅 (입력 시)
	const format_phone_input = (value) => {
		const cleaned = value.replace(/[^0-9]/g, '');
		if (cleaned.length <= 3) return cleaned;
		if (cleaned.length <= 7)
			return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
		return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7, 11)}`;
	};

	// 전화번호 유효성 검증
	const validate_phone = (value) => {
		if (!value) {
			phone_error = '전화번호를 입력해주세요.';
			return false;
		}
		const cleaned = value.replace(/-/g, '');
		const regex = /^010\d{8}$/;
		if (!regex.test(cleaned)) {
			phone_error = '올바른 전화번호를 입력해주세요 (예: 010-1234-5678)';
			return false;
		}
		phone_error = '';
		return true;
	};

	// 이메일 유효성 검증
	const validate_email = (value) => {
		if (!value) {
			email_error = '';
			return true;
		}
		const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!regex.test(value)) {
			email_error = '올바른 이메일 주소를 입력해주세요.';
			return false;
		}
		email_error = '';
		return true;
	};

	const handle_phone_input = (event) => {
		form.contact_phone = format_phone_input(event.target.value);
		validate_phone(form.contact_phone);
	};

	const handle_email_input = () => {
		validate_email(form.contact_email);
	};

	const handle_submit = async () => {
		if (!me?.id) return;

		// 유효성 검증
		const is_phone_valid = validate_phone(form.contact_phone);
		const is_email_valid = validate_email(form.contact_email);

		if (!is_phone_valid || !is_email_valid) {
			show_toast('error', '입력 정보를 확인해주세요.');
			return;
		}

		is_submitting = true;
		try {
			// 하이픈 제거한 전화번호 저장
			const contact_phone = form.contact_phone.replace(/-/g, '');

			const saved_contact = await api.user_contacts.upsert(me.id, {
				contact_phone,
				contact_email: form.contact_email || null,
			});

			// me context 업데이트
			Object.assign(me, { user_contact: saved_contact });

			show_toast('success', '연락처가 저장되었습니다.');
		} catch (e) {
			console.error('Contact save error:', e);
			show_toast('error', '연락처 저장에 실패했습니다.');
		} finally {
			is_submitting = false;
		}
	};
</script>

<svelte:head>
	<title>연락처 관리 | 문</title>
	<meta
		name="description"
		content="외주 프로젝트 연락처 정보를 관리하는 페이지입니다."
	/>
</svelte:head>

<Header>
	<a slot="left" href={`/@${me?.handle}/accounts`}>
		<RiArrowLeftSLine size={24} color={colors.gray[800]} />
	</a>
	<h1 slot="center" class="font-semibold">연락처 관리</h1>
</Header>

<main class="p-4 pb-24">
	{#if is_loading}
		<div class="flex justify-center py-8">
			<span class="loading loading-spinner loading-md"></span>
		</div>
	{:else}
		<!-- 안내 문구 -->
		<div class="rounded-lg bg-gray-100 p-2">
			<p class="text-sm">
				프로젝트 진행 시 의뢰인 또는 전문가가 연락할 수 있는 정보입니다.
				<br />
				연락처를 입력 하시면, 소통을 위한 개인정보 활용 및 알림톡 수신에 동의하게
				됩니다.
			</p>
		</div>

		<!-- 전화번호 -->
		<div class="mt-6">
			<div class="flex items-center gap-1">
				<p class="ml-1 font-semibold">전화번호</p>
				<span class="text-red-500">*</span>
			</div>

			<div class="mt-2">
				<input
					type="tel"
					placeholder="010-1234-5678"
					value={form.contact_phone}
					oninput={handle_phone_input}
					maxlength="13"
					class="input input-bordered focus:border-primary h-[52px] w-full focus:outline-none"
					class:input-error={phone_error}
				/>
			</div>

			{#if phone_error}
				<p class="mt-1 ml-1 text-sm text-red-500">{phone_error}</p>
			{/if}
		</div>

		<!-- 이메일 -->
		<div class="mt-6">
			<p class="ml-1 font-semibold">이메일</p>

			<div class="mt-2">
				<input
					type="email"
					placeholder="example@email.com"
					bind:value={form.contact_email}
					oninput={handle_email_input}
					class="input input-bordered focus:border-primary h-[52px] w-full focus:outline-none"
					class:input-error={email_error}
				/>
			</div>

			{#if email_error}
				<p class="mt-1 ml-1 text-sm text-red-500">{email_error}</p>
			{/if}
		</div>
	{/if}
</main>

<div class="fixed bottom-0 w-full max-w-screen-md bg-white p-4">
	<div class="pb-safe">
		<button
			class="btn btn-primary w-full"
			onclick={handle_submit}
			disabled={is_submitting || is_loading}
		>
			{is_submitting ? '저장 중...' : '저장'}
		</button>
	</div>
</div>
