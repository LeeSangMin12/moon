<script>
	import colors from '$lib/config/colors';
	import {
		get_api_context,
		get_user_context,
	} from '$lib/contexts/app_context.svelte.js';
	import { show_toast } from '$lib/utils/common';
	import { goto } from '$app/navigation';
	import { RiArrowLeftSLine } from 'svelte-remixicon';

	import Header from '$lib/components/ui/Header.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';

	import { update_global_store } from '$lib/store/global_store.js';

	import SetAvatar from './_components/SetAvatar.svelte';
	import SetBasic from './_components/SetBasic.svelte';
	import SetPersonal from './_components/SetPersonal.svelte';

	const { me, update: update_me } = get_user_context();
	const api = get_api_context();

	let { data } = $props();
	let { session } = $derived(data);

	const TITLE = '회원가입';

	let page_count = $state(1);

	let is_back_modal = $state(false);

	let sign_up_form_data = $state({
		phone: '',
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
	 * 다음 버튼 disabled 검사
	 */
	const is_next_btn_disabled = () => {
		const { phone, name, handle, email, gender, birth_date } = sign_up_form_data;

		switch (page_count) {
			case 1:
				return (
					phone === '' ||
					name === '' ||
					handle === '' ||
					email === '' ||
					handle_error === true ||
					email_error === true
				);
			case 2:
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
			const handle_exists =
				await api.users.check_handle_exists(sign_up_form_data.handle);

			if (handle_exists) {
				show_toast('error', '중복된 사용자 이름입니다.');
				return;
			}
		} else if (page_count === 3) {
			await save_users();
		}

		page_count += 1;
	};

	const save_users = async () => {
		update_global_store('loading', true);

		try {
			await api.users.update(session.user.id, {
				phone: sign_up_form_data.phone,
				name: sign_up_form_data.name,
				handle: sign_up_form_data.handle,
				email: sign_up_form_data.email,
				gender: sign_up_form_data.gender,
				birth_date: sign_up_form_data.birth_date,
			});
			update_me({
				phone: sign_up_form_data.phone,
				name: sign_up_form_data.name,
				handle: sign_up_form_data.handle,
				email: sign_up_form_data.email,
				gender: sign_up_form_data.gender,
				birth_date: sign_up_form_data.birth_date,
				avatar_url: sign_up_form_data.avatar_url,
			});

			show_toast('success', '가입이 완료되었어요!');
			goto('/');
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
			style="width: {page_count * (100 / 3)}%"
		></div>
	</div>
</div>

<main>
	{#if page_count === 1}
		<SetBasic bind:data={sign_up_form_data} bind:handle_error bind:email_error />
	{:else if page_count === 2}
		<SetPersonal bind:data={sign_up_form_data} />
	{:else if page_count === 3}
		<SetAvatar bind:avatar_url={sign_up_form_data.avatar_url} />
	{/if}

	<div class="fixed bottom-0 w-full max-w-screen-md bg-white p-4">
		<div class="pb-safe">
			<button
				onclick={go_next}
				class="btn btn-primary w-full"
				disabled={is_next_btn_disabled()}
				>{page_count === 3 ? '시작하기' : '다음'}
			</button>
		</div>
	</div>
</main>

<Modal bind:is_modal_open={is_back_modal} modal_position="center">
	<div in:scale={{ duration: 200, start: 0.95 }} out:fade={{ duration: 150 }}>
		<div class="flex flex-col items-center justify-center py-10 font-semibold">
			<p>다음에 가입 하시겠어요?</p>
		</div>

		<div class="flex">
			<button
				onclick={() => (is_back_modal = false)}
				class="btn w-1/3 rounded-none"
			>
				닫기
			</button>
			<button
				onclick={() => {
					location.href = '/';
				}}
				class="btn btn-error w-2/3 rounded-none text-white"
			>
				다음에 할게요
			</button>
		</div>
	</div>
</Modal>
