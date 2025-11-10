<script>
	/**
	 * 좋아요한 서비스 페이지
	 * @description 사용자가 좋아요한 서비스 목록을 보여주는 페이지
	 */
	import { goto } from '$app/navigation';
	import { RiArrowLeftSLine } from 'svelte-remixicon';

	import Header from '$lib/components/ui/Header.svelte';
	import Service from '$lib/components/Service.svelte';

	import colors from '$lib/config/colors';
	import { get_user_context } from '$lib/contexts/app_context.svelte.js';

	const me = get_user_context();
	const TITLE = '좋아요한 서비스';

	let { data } = $props();
	let { services, service_likes } = $state(data);

	/**
	 * 서비스 좋아요 상태 변경 핸들러
	 * @param {Object} event - 좋아요 변경 이벤트
	 * @param {string} event.service_id - 서비스 ID
	 * @param {Array<Object>} event.likes - 업데이트된 좋아요 배열
	 */
	const handle_like_changed = ({ service_id, likes }) => {
		service_likes = likes;
	};
</script>

<svelte:head>
	<title>좋아요한 서비스 | 문</title>
	<meta
		name="description"
		content="내가 좋아요한 서비스 목록을 한눈에 확인하고, 서비스를 쉽게 관리할 수 있는 문의 좋아요 페이지입니다."
	/>
</svelte:head>

<Header>
	<div slot="left">
		<button
			onclick={() => goto(`/@${me.handle}/accounts`)}
			aria-label="계정 설정으로 돌아가기"
		>
			<RiArrowLeftSLine size={24} color={colors.gray[800]} />
		</button>
	</div>
	<h1 slot="center" class="font-semibold">{TITLE}</h1>
</Header>

<main>
	<div class="mt-4 grid grid-cols-2 gap-4 px-4">
		{#each services as service (service.service_id)}
			{#if service.services}
				<Service
					service={service.services}
					{service_likes}
					onLikeChanged={handle_like_changed}
				/>
			{/if}
		{/each}
	</div>
</main>
