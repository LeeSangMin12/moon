<script>
	export let nav_class = '';
</script>

<header class="sticky top-0 z-50 bg-white whitespace-nowrap {nav_class}">
	<nav class="pt-safe">
		<div class="z-10 flex h-[56px] w-full items-center justify-between">
			<div class="flex flex-1 items-center pl-4">
				<slot name="left" />
			</div>

			<div class="flex flex-1 justify-center whitespace-nowrap">
				<slot name="center" />
			</div>

			<div class="flex flex-1 items-center justify-end pr-4">
				<slot name="right" />
			</div>
		</div>
	</nav>
</header>
