/**
 * Creates an infinite scroll handler using IntersectionObserver
 * @param {Object} config - Configuration object
 * @param {Object} config.items - Reactive items object with getter/setter
 * @param {Function} config.loadMore - Function to load more items (receives lastId)
 * @param {Object} config.isLoading - Reactive loading object with getter/setter
 * @param {string} config.targetId - DOM element ID to observe
 * @param {number} [config.threshold=10] - Minimum items before enabling infinite scroll
 * @returns {Object} Infinite scroll controller
 */
export function create_infinite_scroll(config) {
	const { items, loadMore, isLoading, targetId, threshold = 10 } = config;

	let lastId = $state('');

	/**
	 * Initializes lastId from the last item in the current items array
	 */
	const initializeLastId = () => {
		const items_array = items;
		lastId = items_array[items_array.length - 1]?.id || '';
	};

	/**
	 * Loads more data and appends to items array
	 */
	const loadMoreData = async () => {
		if (isLoading.value) return;

		isLoading.value = true;

		try {
			const newItems = await loadMore(lastId);

			if (newItems?.length > 0) {
				items.push(...newItems);
				lastId = newItems[newItems.length - 1]?.id || '';
			}
		} catch (error) {
			console.error('Error loading more data:', error);
		} finally {
			isLoading.value = false;
		}
	};

	/**
	 * Sets up IntersectionObserver for the target element
	 * @returns {IntersectionObserver} Observer instance for cleanup
	 */
	const setupObserver = () => {
		const observer = new IntersectionObserver(
			(entries) => {
				const entry = entries[0];
				const should_load =
					items.length >= threshold &&
					entry.isIntersecting &&
					!isLoading.value;

				if (should_load) {
					loadMoreData();
				}
			},
			{
				rootMargin: '100px',
				threshold: 0.1,
			},
		);

		const target = document.getElementById(targetId);
		if (target) {
			observer.observe(target);
		}

		return observer;
	};

	return {
		get lastId() {
			return lastId;
		},
		set lastId(value) {
			lastId = value;
		},
		initializeLastId,
		setupObserver,
		loadMoreData,
	};
}
