<script>
	let { onclick, disabled = false, variant = 'primary', children } = $props();

	const variant_classes = {
		primary: 'btn btn-primary ',
		secondary: 'bg-gray-100 text-gray-900',
		outline: 'border border-gray-300 bg-white text-gray-900',
	};
</script>

<div class="fixed bottom-0 w-full max-w-screen-md bg-white p-4">
	<div class="pb-safe">
		<button
			{onclick}
			{disabled}
			class={`w-full rounded-lg  ${variant_classes[variant]} ${disabled ? 'opacity-50' : ''}`}
		>
			{@render children()}
		</button>
	</div>
</div>
