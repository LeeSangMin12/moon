<script>
	import { goto } from '$app/navigation';
	import { RiArrowLeftSLine } from 'svelte-remixicon';

	import Header from '$lib/components/ui/Header/+page.svelte';
	import Modal from '$lib/components/ui/Modal/+page.svelte';

	import colors from '$lib/js/colors';
	import { show_toast } from '$lib/js/common';
	import { api_store } from '$lib/store/api_store';
	import { update_global_store } from '$lib/store/global_store.js';
	import { update_user_store, user_store } from '$lib/store/user_store';

	import Set_avatar from './Set_avatar/+page.svelte';
	import Set_basic from './Set_basic/+page.svelte';
	import Set_personal from './Set_personal/+page.svelte';

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
		birth_date: '',
		avatar_url: '',
	});

	let handle_error = $state(false); //id 유효성 체크

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
		const { phone, name, handle, gender, birth_date } = sign_up_form_data;

		switch (page_count) {
			case 1:
				return (
					phone === '' || name === '' || handle === '' || handle_error === true
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
			const handle_check_duplicate =
				await $api_store.users.select_handle_check_duplicate(
					sign_up_form_data.handle,
				);

			console.log('handle_check_duplicate', handle_check_duplicate);

			if (handle_check_duplicate?.handle) {
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
			await $api_store.users.update(session.user.id, {
				phone: sign_up_form_data.phone,
				name: sign_up_form_data.name,
				handle: sign_up_form_data.handle,
				gender: sign_up_form_data.gender,
				birth_date: sign_up_form_data.birth_date,
			});
			update_user_store({
				phone: sign_up_form_data.phone,
				name: sign_up_form_data.name,
				handle: sign_up_form_data.handle,
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

<main>
	{#if page_count === 1}
		<Set_basic bind:data={sign_up_form_data} bind:handle_error />
	{:else if page_count === 2}
		<Set_personal bind:data={sign_up_form_data} />
	{:else if page_count === 3}
		<Set_avatar bind:avatar_url={sign_up_form_data.avatar_url} />
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
