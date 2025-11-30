<script>
	import colors from '$lib/config/colors';
	import {
		get_api_context,
		get_user_context,
	} from '$lib/contexts/app_context.svelte.js';
	import { show_toast } from '$lib/utils/common';
	import { fade, scale } from 'svelte/transition';
	import { goto } from '$app/navigation';
	import { RiArrowLeftSLine } from 'svelte-remixicon';

	import Header from '$lib/components/ui/Header.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';

	import { update_global_store } from '$lib/store/global_store.js';

	import PhoneVerification from './_components/PhoneVerification.svelte';
	import SetAvatar from './_components/SetAvatar.svelte';
	import SetBasic from './_components/SetBasic.svelte';
	import SetPersonal from './_components/SetPersonal.svelte';

	const me = get_user_context();
	const api = get_api_context();

	let { data } = $props();
	let { session } = $derived(data);

	const TITLE = '회원가입';

	let page_count = $state(1);

	let is_back_modal = $state(false);

	let sign_up_form_data = $state({
		phone: '',
		phone_verified: false,
		gender: '',
		handle: '',
		name: '',
		email: '',
		birth_date: '',
		avatar_url: '',
	});

	let handle_error = $state(false); //id 유효성 체크
	let email_error = $state(false); //email 유효성 체크

	/**
	 * 회원 가입 이전페이지 이동
	 */
	const go_prev = () => {
		if (page_count === 1) {
			is_back_modal = true;
		} else {
			page_count -= 1;
		}
	};

	/**
	 * 전화번호 인증 완료 핸들러
	 */
	const handle_phone_verified = (international_phone) => {
		sign_up_form_data.phone_verified = true;
		sign_up_form_data.phone = international_phone;
	};

	/**
	 * 다음 버튼 disabled 검사
	 */
	const is_next_btn_disabled = () => {
		const { phone_verified, name, handle, email, gender, birth_date } =
			sign_up_form_data;

		switch (page_count) {
			case 1:
				return !phone_verified;
			case 2:
				return (
					name === '' ||
					handle === '' ||
					email === '' ||
					handle_error === true ||
					email_error === true
				);
			case 3:
				return gender === '' || birth_date === '';
			default:
				return false;
		}
	};

	/**
	 * 회원 가입 다음페이지 이동
	 */
	const go_next = async () => {
		if (page_count === 1) {
			// 전화번호 인증 완료 확인
			if (!sign_up_form_data.phone_verified) {
				show_toast('error', '전화번호 인증을 완료해주세요');
				return;
			}
		} else if (page_count === 2) {
			// 아이디 중복 확인
			const handle_exists = await api.users.check_handle_exists(
				sign_up_form_data.handle,
			);

			if (handle_exists) {
				show_toast('error', '중복된 아이디 입니다.');
				return;
			}
		} else if (page_count === 4) {
			// 회원가입 완료
			await save_users();
		}

		page_count += 1;
	};

	const save_users = async () => {
		update_global_store('loading', true);

		try {
			// 기존 카카오 로그인 세션의 user.id 사용
			const user_id = session?.user?.id;

			if (!user_id) {
				throw new Error('세션 정보가 없습니다');
			}

			await api.users.upsert(user_id, {
				phone: sign_up_form_data.phone,
				name: sign_up_form_data.name,
				handle: sign_up_form_data.handle,
				email: sign_up_form_data.email,
				gender: sign_up_form_data.gender,
				birth_date: sign_up_form_data.birth_date,
			});

			Object.assign(me, {
				id: user_id,
				phone: sign_up_form_data.phone,
				name: sign_up_form_data.name,
				handle: sign_up_form_data.handle,
				email: sign_up_form_data.email,
				gender: sign_up_form_data.gender,
				birth_date: sign_up_form_data.birth_date,
				avatar_url: sign_up_form_data.avatar_url,
			});

			show_toast('success', '가입이 완료되었어요!');
			goto('/?signup=complete');
		} catch (err) {
			console.error('회원가입 저장 실패:', err);
			show_toast('error', '회원가입에 실패했습니다');
		} finally {
			update_global_store('loading', false);
		}
	};
</script>

<svelte:head>
	<title>회원가입 | 문</title>
	<meta
		name="description"
		content="문에 가입하고 전문가들과 소통하세요. 간단한 회원가입으로 지식 공유 플랫폼을 시작하세요."
	/>
</svelte:head>

<Header>
	<button slot="left" class="flex items-center" onclick={go_prev}>
		<RiArrowLeftSLine size={24} color={colors.gray[600]} />
	</button>
	<h1 slot="center" class="font-semibold">{TITLE}</h1>
</Header>

<!-- Progress bar -->
<div class="mb-4">
	<div class="h-1 w-full rounded-full bg-gray-200">
		<div
			class="h-1 rounded-lg bg-blue-600 transition-all duration-300"
			style="width: {page_count * (100 / 4)}%"
		></div>
	</div>
</div>

<main>
	{#if page_count === 1}
		<PhoneVerification
			bind:phone={sign_up_form_data.phone}
			on_verified={handle_phone_verified}
		/>
	{:else if page_count === 2}
		<SetBasic
			bind:data={sign_up_form_data}
			bind:handle_error
			bind:email_error
		/>
	{:else if page_count === 3}
		<SetPersonal bind:data={sign_up_form_data} />
	{:else if page_count === 4}
		<SetAvatar
			bind:avatar_url={sign_up_form_data.avatar_url}
			user_id={session?.user?.id}
		/>
	{/if}

	<div class="fixed bottom-0 w-full max-w-screen-md bg-white p-4">
		<div class="pb-safe">
			<button
				onclick={go_next}
				class="btn btn-primary w-full"
				disabled={is_next_btn_disabled()}
				>{page_count === 4 ? '시작하기' : '다음'}
			</button>
		</div>
	</div>
</main>

<Modal bind:is_modal_open={is_back_modal} modal_position="center">
	<div class="p-5">
		<p class="text-[16px] font-semibold text-gray-900">
			가입을 그만두시겠어요?
		</p>

		<div class="mt-5 flex gap-2">
			<button
				onclick={() => {
					location.href = '/';
				}}
				class="flex-1 rounded-lg bg-gray-100 py-3 text-[14px] font-medium text-gray-700 active:bg-gray-200"
			>
				나가기
			</button>
			<button
				onclick={() => (is_back_modal = false)}
				class="flex-1 rounded-lg bg-blue-500 py-3 text-[14px] font-medium text-white active:bg-blue-600"
			>
				계속하기
			</button>
		</div>
	</div>
</Modal>
