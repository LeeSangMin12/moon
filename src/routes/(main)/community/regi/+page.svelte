<script>
	import { PUBLIC_SUPABASE_URL } from '$env/static/public';
	import { goto } from '$app/navigation';
	import { RiArrowLeftSLine } from 'svelte-remixicon';

	import Header from '$lib/components/ui/Header.svelte';
	import Modal from '$lib/components/ui/Modal.svelte';

	import colors from '$lib/config/colors';
	import { show_toast } from '$lib/utils/common';
	import { update_global_store } from '$lib/store/global_store.js';
	import { get_user_context, get_api_context } from '$lib/contexts/app-context.svelte.js';

	const { me } = get_user_context();
	const { api } = get_api_context();

	import SetAvatar from './_components/SetAvatar.svelte';
	import SetContent from './_components/SetContent.svelte';
	import SetTopic from './_components/SetTopic.svelte';

	let { data } = $props();
	let { topic_categories, community } = $derived(data);

	let is_edit_mode = $derived(community != null);
	let TITLE = $derived(is_edit_mode ? '커뮤니티 수정' : '커뮤니티 생성');

	let page_count = $state(1);
	let is_back_modal = $state(false);

	let form_data = $state({
		id: null,
		title: '',
		slug: '',
		content: '',
		avatar_url: '',
		selected_topics: [],
	});

	$effect(() => {
		if (is_edit_mode) {
			form_data.id = community.id;
			form_data.title = community.title;
			form_data.slug = community.slug;
			form_data.content = community.content;
			form_data.avatar_url = community.avatar_url;
			form_data.selected_topics = community.community_topics.map(
				(ct) => ct.topics,
			);
		} else {
			form_data.id = null;
			form_data.title = '';
			form_data.slug = '';
			form_data.content = '';
			form_data.avatar_url = '';
			form_data.selected_topics = [];
		}
	});

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
		switch (page_count) {
			case 1:
				return form_data.selected_topics.length === 0;
			case 2:
				return (
					form_data.title === '' ||
					form_data.slug === '' ||
					form_data.content === ''
				);
			default:
				return false;
		}
	};

	const go_next = async () => {
		if (page_count === 2) {
			const existing_community = await validate_slug();

			if (existing_community) {
				show_toast('error', '이미 사용중인 슬러그입니다.');
				return;
			}
		} else if (page_count === 3) {
			await save_community();
			return;
		}

		page_count += 1;
	};

	const save_community = async () => {
		update_global_store('loading', true);

		try {
			if (is_edit_mode) {
				// 수정 로직
				await api.communities.update(form_data.id, {
					title: form_data.title,
					slug: form_data.slug,
					content: form_data.content,
				});

				await api.community_topics.delete_by_community_id(form_data.id);
				await api.community_topics.insert(
					form_data.id,
					form_data.selected_topics,
				);

				if (
					typeof form_data.avatar_url === 'object' &&
					form_data.avatar_url !== null
				) {
					const file_ext = form_data.avatar_url.name.split('.').pop();
					const file_path = `${form_data.id}/${Date.now()}.${file_ext}`;
					await api.community_avatars.upload(
						file_path,
						form_data.avatar_url,
					);

					const img_url = `${PUBLIC_SUPABASE_URL}/storage/v1/object/public/communities/avatars/${file_path}`;
					await api.communities.update(form_data.id, {
						avatar_url: img_url,
					});
				}
				show_toast('success', '커뮤니티 수정이 완료되었어요!');
				goto(`/community/${form_data.slug}`);
			} else {
				const new_community = await api.communities.insert({
					creator_id: me.id,
					title: form_data.title,
					slug: form_data.slug,
					content: form_data.content,
				});
				await api.community_topics.insert(
					new_community.id,
					form_data.selected_topics,
				);
				await api.community_members.insert(
					new_community.id,
					me.id,
				);

				if (form_data.avatar_url) {
					const file_ext = form_data.avatar_url.name.split('.').pop();
					const file_path = `${new_community.id}/${Date.now()}.${file_ext}`;
					await api.community_avatars.upload(
						file_path,
						form_data.avatar_url,
					);

					const img_url = `${PUBLIC_SUPABASE_URL}/storage/v1/object/public/communities/avatars/${file_path}`;
					await api.communities.update(new_community.id, {
						avatar_url: img_url,
					});
				}

				show_toast('success', '커뮤니티 생성이 완료되었어요!');
				goto(`/community/${form_data.slug}`, {
					replaceState: true,
				});
			}
		} finally {
			update_global_store('loading', false);
		}
	};

	const validate_slug = async () => {
		if (is_edit_mode) {
			return null;
		}

		const existing_community = await api.communities.select_by_slug(
			form_data.slug,
		);

		return existing_community;
	};
</script>

<svelte:head>
	<title>커뮤니티 생성 | 문</title>
	<meta
		name="description"
		content="커뮤니티를 생성할 수 있는 문의 커뮤니티 생성 페이지입니다."
	/>
</svelte:head>

<Header>
	<button slot="left" class="flex items-center" onclick={go_prev}>
		<RiArrowLeftSLine size={24} color={colors.gray[600]} />
	</button>

	<h1 slot="center" class=" font-semibold">{TITLE}</h1>
</Header>

<main>
	<div class="h-1 w-full rounded-full bg-gray-200 dark:bg-gray-300">
		<div
			class="bg-primary h-1 rounded-full"
			style={`width: ${page_count * (100 / 3)}%`}
		></div>
	</div>

	{#if page_count === 1}
		<SetTopic
			bind:selected_topics={form_data.selected_topics}
			{topic_categories}
		/>
	{:else if page_count === 2}
		<SetContent
			bind:title={form_data.title}
			bind:slug={form_data.slug}
			bind:content={form_data.content}
			{is_edit_mode}
		/>
	{:else if page_count === 3}
		<SetAvatar bind:avatar_url={form_data.avatar_url} />
	{/if}

	<div class="fixed bottom-0 w-full max-w-screen-md bg-white p-4">
		<button
			class="btn btn-primary w-full"
			disabled={is_next_btn_disabled()}
			onclick={go_next}
		>
			{page_count === 3
				? is_edit_mode
					? '수정 완료'
					: '커뮤니티 만들기'
				: '다음'}
		</button>
	</div>
</main>

<Modal bind:is_modal_open={is_back_modal} modal_position="center">
	<div in:scale={{ duration: 200, start: 0.95 }} out:fade={{ duration: 150 }}>
		<div class="flex flex-col items-center justify-center py-10 font-semibold">
			<p>다음에 {is_edit_mode ? '수정' : '생성'} 하시겠어요?</p>
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
					goto(is_edit_mode ? `/community/${form_data.slug}` : '/community');
				}}
				class="btn btn-error w-2/3 rounded-none text-white"
			>
				다음에 할게요
			</button>
		</div>
	</div>
</Modal>
