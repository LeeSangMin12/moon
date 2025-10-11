<script>
	import { enhance } from '$app/forms';
	import { smartGoBack } from '$lib/utils/navigation';
	import { RiArrowLeftSLine, RiAddLine, RiDeleteBinLine, RiFileExcel2Line, RiDownload2Line } from 'svelte-remixicon';
	import * as XLSX from 'xlsx';

	import Header from '$lib/components/ui/Header.svelte';
	import colors from '$lib/config/colors';
	import { show_toast } from '$lib/utils/common';

	let accounts = $state([
		{ email: '', password: '', name: '', handle: '' }
	]);

	let is_submitting = $state(false);
	let results = $state(null);
	let file_input;

	const add_account = () => {
		accounts = [...accounts, { email: '', password: '', name: '', handle: '' }];
	};

	const remove_account = (index) => {
		accounts = accounts.filter((_, i) => i !== index);
	};

	// XLSX 파일 업로드 핸들러
	const handle_file_upload = async (event) => {
		const file = event.target.files?.[0];
		if (!file) return;

		try {
			const data = await file.arrayBuffer();
			const workbook = XLSX.read(data);
			const first_sheet = workbook.Sheets[workbook.SheetNames[0]];
			const json_data = XLSX.utils.sheet_to_json(first_sheet);

			if (json_data.length === 0) {
				show_toast('error', '파일에 데이터가 없습니다.');
				return;
			}

			// 컬럼명 매핑 (유연하게 처리)
			const parsed_accounts = json_data.map((row, index) => {
				// 컬럼명을 소문자로 변환하여 매칭
				const normalized_row = Object.keys(row).reduce((acc, key) => {
					acc[key.toLowerCase().trim()] = row[key];
					return acc;
				}, {});

				return {
					email: normalized_row['email'] || normalized_row['이메일'] || '',
					password: normalized_row['password'] || normalized_row['비밀번호'] || '',
					name: normalized_row['name'] || normalized_row['이름'] || '',
					handle: normalized_row['handle'] || normalized_row['핸들'] || normalized_row['아이디'] || ''
				};
			});

			// 필수 필드가 없는 항목 체크
			const invalid_rows = parsed_accounts.filter(acc =>
				!acc.email || !acc.password || !acc.name || !acc.handle
			);

			if (invalid_rows.length > 0) {
				show_toast('error', `${invalid_rows.length}개의 행에 필수 필드가 누락되었습니다. (email, password, name, handle)`);
				return;
			}

			accounts = parsed_accounts;
			show_toast('success', `${parsed_accounts.length}개의 계정 정보를 불러왔습니다.`);

			// 파일 입력 초기화
			event.target.value = '';
		} catch (error) {
			console.error('File parsing error:', error);
			show_toast('error', '파일을 읽는 중 오류가 발생했습니다.');
		}
	};

	// 샘플 XLSX 파일 다운로드
	const download_sample = () => {
		const sample_data = [
			{ email: 'user1@example.com', password: 'password123', name: '홍길동', handle: 'user1' },
			{ email: 'user2@example.com', password: 'password456', name: '김철수', handle: 'user2' },
			{ email: 'user3@example.com', password: 'password789', name: '이영희', handle: 'user3' },
		];

		const worksheet = XLSX.utils.json_to_sheet(sample_data);
		const workbook = XLSX.utils.book_new();
		XLSX.utils.book_append_sheet(workbook, worksheet, 'Accounts');
		XLSX.writeFile(workbook, '계정_생성_샘플.xlsx');
	};

	const handle_submit = () => {
		// 빈 필드 체크
		const has_empty = accounts.some(
			acc => !acc.email || !acc.password || !acc.name || !acc.handle
		);

		if (has_empty) {
			show_toast('error', '모든 필드를 입력해주세요.');
			return false;
		}

		is_submitting = true;
		return async ({ result, update }) => {
			is_submitting = false;

			if (result.type === 'success' && result.data?.success) {
				results = result.data;
				show_toast('success', `${result.data.created}개 계정이 생성되었습니다.`);

				// 성공한 항목들 제거, 실패한 항목만 남김
				if (result.data.errors && result.data.errors.length > 0) {
					const failed_emails = result.data.errors.map(e => e.email);
					accounts = accounts.filter(acc => failed_emails.includes(acc.email));
				} else {
					// 모두 성공했으면 초기화
					accounts = [{ email: '', password: '', name: '', handle: '' }];
				}
			} else if (result.type === 'failure') {
				show_toast('error', result.data?.error || '계정 생성에 실패했습니다.');
			}

			await update();
		};
	};
</script>

<svelte:head>
	<title>관리자 - 대량 계정 생성</title>
</svelte:head>

<Header>
	<button slot="left" onclick={smartGoBack}>
		<RiArrowLeftSLine size={26} color={colors.gray[600]} />
	</button>
</Header>

<div class="container mx-auto max-w-5xl px-4 py-8">
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-gray-900">대량 계정 생성</h1>
		<p class="mt-2 text-gray-600">여러 개의 가계정을 한번에 생성할 수 있습니다.</p>
	</div>

	<!-- XLSX 파일 업로드 섹션 -->
	<div class="mb-6 rounded-lg border-2 border-dashed border-blue-300 bg-blue-50 p-6">
		<div class="flex items-center justify-between">
			<div class="flex-1">
				<h3 class="mb-2 flex items-center gap-2 font-semibold text-blue-900">
					<RiFileExcel2Line size={24} />
					Excel 파일로 가져오기
				</h3>
				<p class="text-sm text-blue-700">
					Excel 파일(.xlsx)을 업로드하여 여러 계정을 한번에 불러올 수 있습니다.
				</p>
				<p class="mt-1 text-xs text-blue-600">
					컬럼명: email, password, name, handle (또는 한글: 이메일, 비밀번호, 이름, 핸들)
				</p>
			</div>
			<div class="flex gap-2">
				<button
					type="button"
					onclick={download_sample}
					class="flex items-center gap-2 rounded-lg border border-blue-600 bg-white px-4 py-2 text-sm font-semibold text-blue-600 transition hover:bg-blue-50"
				>
					<RiDownload2Line size={18} />
					샘플 다운로드
				</button>
				<label class="flex cursor-pointer items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700">
					<RiFileExcel2Line size={18} />
					파일 선택
					<input
						type="file"
						accept=".xlsx, .xls"
						onchange={handle_file_upload}
						bind:this={file_input}
						class="hidden"
					/>
				</label>
			</div>
		</div>
	</div>

	<form method="POST" action="?/create" use:enhance={handle_submit}>
		<input type="hidden" name="accounts" value={JSON.stringify(accounts)} />

		<div class="space-y-4">
			{#each accounts as account, index}
				<div class="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
					<div class="mb-4 flex items-center justify-between">
						<h3 class="font-semibold text-gray-700">계정 #{index + 1}</h3>
						{#if accounts.length > 1}
							<button
								type="button"
								onclick={() => remove_account(index)}
								class="flex items-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-sm text-red-600 transition hover:bg-red-100"
							>
								<RiDeleteBinLine size={16} />
								삭제
							</button>
						{/if}
					</div>

					<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
						<div>
							<label for="email-{index}" class="mb-1 block text-sm font-medium text-gray-700">
								이메일 <span class="text-red-500">*</span>
							</label>
							<input
								id="email-{index}"
								type="email"
								bind:value={account.email}
								placeholder="example@email.com"
								class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
								required
							/>
						</div>

						<div>
							<label for="password-{index}" class="mb-1 block text-sm font-medium text-gray-700">
								비밀번호 <span class="text-red-500">*</span>
							</label>
							<input
								id="password-{index}"
								type="text"
								bind:value={account.password}
								placeholder="비밀번호"
								class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
								required
							/>
						</div>

						<div>
							<label for="name-{index}" class="mb-1 block text-sm font-medium text-gray-700">
								이름 <span class="text-red-500">*</span>
							</label>
							<input
								id="name-{index}"
								type="text"
								bind:value={account.name}
								placeholder="홍길동"
								class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
								required
							/>
						</div>

						<div>
							<label for="handle-{index}" class="mb-1 block text-sm font-medium text-gray-700">
								핸들 (아이디) <span class="text-red-500">*</span>
							</label>
							<input
								id="handle-{index}"
								type="text"
								bind:value={account.handle}
								placeholder="user123"
								class="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
								required
							/>
						</div>
					</div>
				</div>
			{/each}
		</div>

		<div class="mt-6 flex gap-4">
			<button
				type="button"
				onclick={add_account}
				class="flex items-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-white px-6 py-3 font-semibold text-gray-700 transition hover:border-blue-500 hover:text-blue-600"
			>
				<RiAddLine size={20} />
				계정 추가
			</button>

			<button
				type="submit"
				disabled={is_submitting}
				class="flex-1 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-3 font-semibold text-white shadow transition hover:from-blue-600 hover:to-blue-700 disabled:opacity-50"
			>
				{is_submitting ? '생성 중...' : `${accounts.length}개 계정 생성`}
			</button>
		</div>
	</form>

	<!-- 결과 표시 -->
	{#if results}
		<div class="mt-8 rounded-lg border border-gray-200 bg-white p-6 shadow">
			<h2 class="mb-4 text-xl font-bold text-gray-800">생성 결과</h2>

			<div class="mb-4 flex gap-4">
				<div class="rounded-lg bg-green-50 px-4 py-2">
					<span class="text-sm text-green-600">성공: </span>
					<span class="font-bold text-green-800">{results.created}개</span>
				</div>
				<div class="rounded-lg bg-red-50 px-4 py-2">
					<span class="text-sm text-red-600">실패: </span>
					<span class="font-bold text-red-800">{results.failed}개</span>
				</div>
			</div>

			{#if results.results && results.results.length > 0}
				<div class="mb-6">
					<h3 class="mb-2 font-semibold text-green-700">성공한 계정</h3>
					<div class="overflow-x-auto rounded-lg border">
						<table class="min-w-full text-sm">
							<thead class="bg-gray-50">
								<tr>
									<th class="px-4 py-2 text-left">이메일</th>
									<th class="px-4 py-2 text-left">핸들</th>
									<th class="px-4 py-2 text-left">User ID</th>
								</tr>
							</thead>
							<tbody>
								{#each results.results as result}
									<tr class="border-t">
										<td class="px-4 py-2">{result.email}</td>
										<td class="px-4 py-2">@{result.handle}</td>
										<td class="px-4 py-2 font-mono text-xs text-gray-500">{result.user_id}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			{/if}

			{#if results.errors && results.errors.length > 0}
				<div>
					<h3 class="mb-2 font-semibold text-red-700">실패한 계정</h3>
					<div class="overflow-x-auto rounded-lg border">
						<table class="min-w-full text-sm">
							<thead class="bg-gray-50">
								<tr>
									<th class="px-4 py-2 text-left">이메일</th>
									<th class="px-4 py-2 text-left">핸들</th>
									<th class="px-4 py-2 text-left">오류</th>
								</tr>
							</thead>
							<tbody>
								{#each results.errors as error}
									<tr class="border-t">
										<td class="px-4 py-2">{error.email}</td>
										<td class="px-4 py-2">@{error.handle}</td>
										<td class="px-4 py-2 text-red-600">{error.error}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			{/if}
		</div>
	{/if}
</div>
