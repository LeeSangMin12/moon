<script>
	import {
		get_api_context,
		get_user_context,
	} from '$lib/contexts/app_context.svelte.js';
	import { comma, format_date, show_toast } from '$lib/utils/common';
	import { browser } from '$app/environment';
	import { onMount } from 'svelte';
	import {
		RiCheckLine,
		RiRefundLine,
		RiShoppingBag3Line,
	} from 'svelte-remixicon';

	const me = get_user_context();
	const api = get_api_context();

	let { data } = $props();
	let { user, transactions, stats } = $state(data);

	// 서버에서 받은 사용자 정보를 컨텍스트에 동기화
	$effect(() => {
		if (user?.id && !me.id) {
			Object.assign(me, user);
		}
	});

	// 결제 폼 상태
	let test_amount = $state(1000);
	let is_processing = $state(false);

	// 필터 상태
	let selected_status = $state('all');

	// 포트원 SDK 로드 상태
	let is_portone_loaded = $state(false);

	// 필터링된 거래 목록
	const filtered_transactions = $derived(
		selected_status === 'all'
			? transactions
			: transactions.filter((t) => t.status === selected_status),
	);

	// 포트원 SDK 로드
	onMount(() => {
		if (browser) {
			const script = document.createElement('script');
			script.src = 'https://cdn.iamport.kr/v1/iamport.js';
			script.async = true;
			script.onload = () => {
				is_portone_loaded = true;
				// 포트원 초기화 (환경 변수에서 가져올 수도 있음)
				const IMP = window.IMP;
				IMP.init('imp66011865'); // 포트원 가맹점 식별코드
			};
			document.head.appendChild(script);
		}
	});

	// 결제 요청
	const handle_payment = async () => {
		// 로그인 체크
		if (!me?.id) {
			show_toast('로그인이 필요합니다.', 'error');
			return;
		}

		if (!is_portone_loaded) {
			show_toast('포트원 SDK가 로드되지 않았습니다.', 'error');
			return;
		}

		if (test_amount < 100 || test_amount > 10000000) {
			show_toast('결제 금액은 100원 ~ 10,000,000원 사이여야 합니다.', 'error');
			return;
		}

		is_processing = true;

		// 완전히 고유한 UUID 기반 merchant_uid (이전 거래와 충돌 방지)
		const merchant_uid = `order_${crypto.randomUUID()}`;

		// 먼저 DB에 pending 상태로 저장
		try {
			await api.payments.insert_transaction({
				user_id: me.id,
				merchant_uid: merchant_uid,
				amount: test_amount,
				status: 'pending',
			});
		} catch (err) {
			console.error('Failed to create transaction:', err);
			show_toast('결제 정보 저장에 실패했습니다.', 'error');
			is_processing = false;
			return;
		}

		const IMP = window.IMP;
		IMP.request_pay(
			{
				pg: 'tosspayments.iamporttest_3', // PG사 (토스페이먼츠 테스트)
				pay_method: 'card', // 결제 수단 (카드만)
				merchant_uid: merchant_uid,
				name: '포트원 결제 테스트',
				amount: test_amount,
				buyer_email: me.email || 'test@example.com',
				buyer_name: me.name || '테스트 사용자',
			},
			async (rsp) => {
				// 포트원 응답 전체 로깅
				console.log('🔔 [포트원 응답] 전체 응답 객체:', rsp);
				console.log('🔔 [포트원 응답] success:', rsp.success);
				console.log('🔔 [포트원 응답] imp_uid:', rsp.imp_uid);
				console.log('🔔 [포트원 응답] merchant_uid:', rsp.merchant_uid);

				// imp_uid가 있으면 서버에서 실제 결제 상태 조회
				if (rsp.imp_uid) {
					console.log('🔍 [결제 검증] 서버에서 결제 상태 조회 시작...');

					try {
						const verify_response = await fetch('/api/portone/verify', {
							method: 'POST',
							headers: {
								'Content-Type': 'application/json',
							},
							body: JSON.stringify({
								imp_uid: rsp.imp_uid,
								merchant_uid: rsp.merchant_uid || merchant_uid,
							}),
						});

						const verify_result = await verify_response.json();
						console.log('🔍 [결제 검증] 검증 결과:', verify_result);

						if (verify_result.success && verify_result.status === 'paid') {
							// 결제 완료
							console.log('✅ [결제 성공] 서버 검증 완료');
							show_toast('결제가 완료되었습니다!', 'success');

							// 거래 목록에 추가
							transactions = [verify_result.transaction, ...transactions];

							// 통계 업데이트
							stats.total_count++;
							stats.completed_count++;
							stats.total_amount += test_amount;

							// 폼 초기화
							test_amount = 1000;
						} else {
							// 결제 실패 또는 취소
							console.log(
								'⚠️ [결제 검증] 결제 완료되지 않음:',
								verify_result.status,
							);
							show_toast('결제가 완료되지 않았습니다.', 'info');
						}
					} catch (err) {
						console.error('❌ [결제 검증] 검증 API 호출 실패:', err);
						show_toast('결제 상태 확인 중 오류가 발생했습니다.', 'error');
					}

					is_processing = false;
					return;
				}

				// 기존 로직 (success 필드가 있는 경우)
				if (rsp.success === true) {
					// 결제 성공
					console.log('✅ [결제 성공] imp_uid:', rsp.imp_uid);
					console.log('✅ [결제 성공] 카드정보:', {
						card_name: rsp.card_name,
						card_number: rsp.card_number,
						pg_provider: rsp.pg_provider,
						pg_tid: rsp.pg_tid,
					});

					try {
						// DB 업데이트
						const updated = await api.payments.update_by_merchant_uid(
							merchant_uid,
							{
								imp_uid: rsp.imp_uid,
								status: 'completed',
								payment_method: rsp.pay_method,
								pg_provider: rsp.pg_provider,
								pg_tid: rsp.pg_tid,
								receipt_url: rsp.receipt_url,
								card_name: rsp.card_name,
								card_number: rsp.card_number,
							},
						);

						console.log('✅ [결제 성공] DB 업데이트 완료:', updated);
						show_toast('결제가 완료되었습니다!', 'success');

						// 거래 목록에 추가
						transactions = [updated, ...transactions];

						// 통계 업데이트
						stats.total_count++;
						stats.completed_count++;
						stats.total_amount += test_amount;

						// 폼 초기화
						test_amount = 1000;
					} catch (err) {
						console.error('❌ [결제 성공 후 DB 업데이트 실패]', err);
						show_toast('결제 정보 업데이트에 실패했습니다.', 'error');
					}
				} else if (rsp.success === false && rsp.error_msg) {
					// 결제 실패 (에러 발생)
					console.error('❌ [결제 실패] 상세 정보:', {
						error_code: rsp.error_code,
						error_msg: rsp.error_msg,
						imp_uid: rsp.imp_uid,
						merchant_uid: rsp.merchant_uid,
						status: rsp.status,
						pay_method: rsp.pay_method,
						pg_provider: rsp.pg_provider,
						pg_tid: rsp.pg_tid,
						'전체 응답': rsp,
					});

					show_toast(`결제 실패: ${rsp.error_msg}`, 'error');

					// DB에서 상태 업데이트
					try {
						await api.payments.update_by_merchant_uid(merchant_uid, {
							status: 'cancelled',
							cancel_reason: rsp.error_msg,
						});
						console.log('ℹ️ [결제 실패] DB 상태를 cancelled로 업데이트 완료');
					} catch (err) {
						console.error('❌ [결제 실패 후 DB 업데이트 실패]', err);
					}
				} else {
					// 사용자가 결제를 취소하거나 중단 (success: undefined)
					console.log(
						'⚠️ [결제 취소] 사용자가 결제를 취소했거나 완료하지 않았습니다',
					);
					console.log('⚠️ [결제 취소] imp_uid:', rsp.imp_uid);

					show_toast('결제가 취소되었습니다.', 'info');

					// DB에서 상태 업데이트
					try {
						await api.payments.update_by_merchant_uid(merchant_uid, {
							status: 'cancelled',
							cancel_reason: '사용자 취소',
						});
						console.log('ℹ️ [결제 취소] DB 상태를 cancelled로 업데이트 완료');
					} catch (err) {
						console.error('❌ [결제 취소 후 DB 업데이트 실패]', err);
					}
				}

				is_processing = false;
			},
		);
	};

	// 결제 취소
	const handle_cancel = async (transaction) => {
		if (
			!confirm(
				'이 결제를 취소하시겠습니까?\n\n포트원 API를 통해 실제로 결제가 취소됩니다.',
			)
		) {
			return;
		}

		try {
			// 서버 API를 통해 포트원 결제 취소
			const response = await fetch('/api/portone/cancel', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					transaction_id: transaction.id,
					cancel_reason: '사용자 요청에 의한 취소',
				}),
			});

			const result = await response.json();

			if (!response.ok) {
				throw new Error(result.message || '결제 취소에 실패했습니다');
			}

			show_toast('결제가 취소되었습니다.', 'success');

			// 거래 목록 업데이트
			transactions = transactions.map((t) =>
				t.id === result.data.id ? result.data : t,
			);

			// 통계 업데이트
			stats.completed_count--;
			stats.cancelled_count++;
			stats.total_amount -= transaction.amount;
		} catch (err) {
			console.error('Failed to cancel transaction:', err);
			show_toast(err.message || '결제 취소에 실패했습니다.', 'error');
		}
	};

	// 상태 라벨
	const get_status_label = (status) => {
		const labels = {
			pending: '대기',
			completed: '완료',
			cancelled: '취소',
			refunded: '환불',
		};
		return labels[status] || status;
	};

	// 상태 색상
	const get_status_color = (status) => {
		const colors = {
			pending: 'bg-yellow-100 text-yellow-800',
			completed: 'bg-green-100 text-green-800',
			cancelled: 'bg-gray-100 text-gray-800',
			refunded: 'bg-blue-100 text-blue-800',
		};
		return colors[status] || 'bg-gray-100 text-gray-800';
	};
</script>

<svelte:head>
	<title>포트원 결제 테스트 | Moon</title>
</svelte:head>

<div class="container mx-auto max-w-6xl px-4 py-8">
	<!-- 헤더 -->
	<div class="mb-8">
		<h1 class="text-3xl font-bold">포트원 결제 테스트</h1>
	</div>

	<!-- 결제 폼 -->
	<div class="mb-8 rounded-lg border bg-white p-6">
		<h2 class="mb-4 text-xl font-bold">테스트 결제</h2>

		<div class="flex flex-col gap-4 md:flex-row md:items-end">
			<div class="flex-1">
				<label
					for="amount"
					class="mb-2 block text-sm font-medium text-gray-700"
				>
					결제 금액 (원)
				</label>
				<input
					id="amount"
					type="number"
					min="100"
					max="10000000"
					step="100"
					bind:value={test_amount}
					class="w-full rounded-lg border px-4 py-2"
					placeholder="100 ~ 10,000,000"
				/>
			</div>

			<button
				onclick={handle_payment}
				disabled={is_processing || !is_portone_loaded}
				class="rounded-lg bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
			>
				{is_processing ? '처리 중...' : '결제하기'}
			</button>
		</div>

		{#if !is_portone_loaded}
			<p class="mt-4 text-sm text-yellow-600">포트원 SDK를 로드하는 중...</p>
		{/if}
	</div>

	<!-- 통계 카드 -->
	<div class="mb-8 flex gap-4">
		<div class="flex-1 rounded-lg border bg-white p-6">
			<div class="text-sm text-gray-600">총 거래</div>
			<div class="mt-2 text-2xl font-bold">{stats.total_count}건</div>
		</div>
		<div class="flex-1 rounded-lg border bg-white p-6">
			<div class="text-sm text-gray-600">완료</div>
			<div class="mt-2 text-2xl font-bold text-green-600">
				{stats.completed_count}건
			</div>
		</div>
		<div class="flex-1 rounded-lg border bg-white p-6">
			<div class="text-sm text-gray-600">취소/환불</div>
			<div class="mt-2 text-2xl font-bold text-gray-600">
				{stats.cancelled_count + stats.refunded_count}건
			</div>
		</div>
		<div class="flex-1 rounded-lg border bg-white p-6">
			<div class="text-sm text-gray-600">총 결제 금액</div>
			<div class="mt-2 text-2xl font-bold">{comma(stats.total_amount)}원</div>
		</div>
	</div>

	<!-- 거래 내역 -->
	<div class="rounded-lg border bg-white p-6">
		<div class="mb-4 flex items-center justify-between">
			<h2 class="text-xl font-bold">거래 내역</h2>

			<!-- 필터 -->
			<select
				bind:value={selected_status}
				class="rounded-lg border px-3 py-1.5 text-sm"
			>
				<option value="all">전체</option>
				<option value="pending">대기</option>
				<option value="completed">완료</option>
				<option value="cancelled">취소</option>
				<option value="refunded">환불</option>
			</select>
		</div>

		{#if filtered_transactions.length === 0}
			<div class="py-12 text-center text-gray-500">거래 내역이 없습니다.</div>
		{:else}
			<div class="overflow-x-auto">
				<table class="min-w-full table-auto">
					<thead class="border-b bg-gray-50">
						<tr>
							<th
								class="w-2/5 px-3 py-3 text-left text-sm font-medium text-gray-700"
								>거래 ID</th
							>
							<th
								class="w-32 px-3 py-3 text-right text-sm font-medium text-gray-700"
								>금액</th
							>
							<th
								class="w-24 px-3 py-3 text-center text-sm font-medium text-gray-700"
								>상태</th
							>
							<th
								class="w-40 px-3 py-3 text-left text-sm font-medium text-gray-700"
								>결제수단</th
							>
							<th
								class="w-28 px-3 py-3 text-center text-sm font-medium text-gray-700"
								>액션</th
							>
						</tr>
					</thead>
					<tbody>
						{#each filtered_transactions as transaction}
							<tr class="border-b hover:bg-gray-50">
								<td class="px-3 py-4 text-sm">
									<div
										class="max-w-xs truncate font-mono text-xs"
										title={transaction.merchant_uid}
									>
										{transaction.merchant_uid?.slice(0, 30)}...
									</div>
									{#if transaction.imp_uid}
										<div class="mt-1 font-mono text-xs text-gray-500">
											{transaction.imp_uid}
										</div>
									{/if}
								</td>
								<td
									class="px-3 py-4 text-right text-sm font-medium whitespace-nowrap"
								>
									{comma(transaction.amount)}원
								</td>
								<td class="px-3 py-4 text-center">
									<span
										class="inline-block rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap {get_status_color(
											transaction.status,
										)}"
									>
										{get_status_label(transaction.status)}
									</span>
								</td>
								<td class="px-3 py-4 text-sm">
									{#if transaction.card_name}
										<div class="font-medium">{transaction.card_name}</div>
										{#if transaction.card_number}
											<div class="mt-0.5 text-xs text-gray-500">
												{transaction.card_number}
											</div>
										{/if}
									{:else}
										<span class="text-gray-400">-</span>
									{/if}
								</td>
								<td class="px-3 py-4 text-center">
									{#if transaction.status === 'completed'}
										<button
											onclick={() => handle_cancel(transaction)}
											class="text-sm font-medium text-red-600 hover:text-red-800 hover:underline"
										>
											취소
										</button>
									{:else if transaction.receipt_url}
										<a
											href={transaction.receipt_url}
											target="_blank"
											rel="noopener noreferrer"
											class="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline"
										>
											영수증
										</a>
									{:else}
										<span class="text-sm text-gray-400">-</span>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>

<style>
	/* 테이블 스타일 */
	table {
		border-collapse: collapse;
	}

	/* 반응형 */
	@media (max-width: 768px) {
		.container {
			padding-left: 1rem;
			padding-right: 1rem;
		}
	}
</style>
