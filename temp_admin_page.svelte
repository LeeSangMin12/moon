<svelte:head>
	<title>관리자 - 문 충전 관리</title>
</svelte:head>

<div class="container mx-auto max-w-7xl px-4 py-8">
	<div class="mb-8">
		<h1 class="text-3xl font-bold text-gray-900">문 충전 관리</h1>
		<p class="mt-2 text-gray-600">사용자들의 문 충전 요청을 관리합니다.</p>
	</div>

	<div class="rounded-lg border border-blue-200 bg-blue-50 p-6">
		<h3 class="text-lg font-medium text-blue-800">관리자 페이지 테스트</h3>
		<p class="mt-2 text-blue-700">
			이 페이지가 보인다면 기본 라우팅은 정상적으로 작동하고 있습니다.
		</p>
		<p class="mt-2 text-blue-700">
			다음 단계: 브라우저 콘솔을 확인하고 데이터베이스 테이블을 생성해주세요.
		</p>
	</div>

	<div class="mt-8 space-y-4">
		<h2 class="text-xl font-semibold">설정 안내</h2>
		<ol class="list-inside list-decimal space-y-2 text-gray-700">
			<li>Supabase 관리 패널의 SQL 에디터로 이동</li>
			<li>
				<code class="rounded bg-gray-100 px-2 py-1"
					>moon_charges_schema.sql</code
				> 파일의 내용을 실행
			</li>
			<li>
				<code class="rounded bg-gray-100 px-2 py-1">add_role_column.sql</code> 파일의
				내용을 실행
			</li>
			<li>페이지를 새로고침</li>
		</ol>
	</div>
</div>
