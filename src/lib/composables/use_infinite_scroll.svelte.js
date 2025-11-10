export function create_infinite_scroll(config) {
	const {
		items,
		loadMore,
		isLoading,
		targetId,
		threshold = 10,
		delay = 1000
	} = config;

	let lastId = $state('');

	const initializeLastId = () => {
		lastId = items.value[items.value.length - 1]?.id || '';
	};

	const setupObserver = () => {
		const observer = new IntersectionObserver((entries) => {
			entries.forEach((entry) => {
				if (items.value.length >= threshold && entry.isIntersecting && !isLoading.value) {
					isLoading.value = true;
					setTimeout(async () => {
						await loadMoreData();
					}, delay);
				}
			});
		});

		const target = document.getElementById(targetId);
		if (target) observer.observe(target);

		return observer;
	};

	const loadMoreData = async () => {
		try {
			const newItems = await loadMore(lastId);
			isLoading.value = false;

			if (newItems.length > 0) {
				items.value = [...items.value, ...newItems];
				lastId = newItems[newItems.length - 1]?.id || '';
			}
		} catch (error) {
			console.error('Error loading more data:', error);
			isLoading.value = false;
		}
	};

	return {
		initializeLastId,
		setupObserver,
		loadMoreData,
		get lastId() { return lastId; },
		set lastId(value) { lastId = value; }
	};
}
