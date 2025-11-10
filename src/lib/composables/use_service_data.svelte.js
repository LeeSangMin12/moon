export function create_service_data(initialData, api) {
	let services = $state(initialData.services);
	let serviceLikes = $state(initialData.service_likes);
	let searchText = $state('');
	let isInfiniteLoading = $state(false);

	const searchServices = async () => {
		if (searchText.trim()) {
			services = await api.services.select_by_search(searchText);
		} else {
			services = initialData.services;
		}
	};

	const loadMoreServices = async (lastServiceId) => {
		return await api.services.select_infinite_scroll(lastServiceId);
	};

	return {
		get services() { return services; },
		set services(value) { services = value; },
		get serviceLikes() { return serviceLikes; },
		set serviceLikes(value) { serviceLikes = value; },
		get searchText() { return searchText; },
		set searchText(value) { searchText = value; },
		get isInfiniteLoading() { return isInfiniteLoading; },
		set isInfiniteLoading(value) { isInfiniteLoading = value; },
		searchServices,
		loadMoreServices
	};
}
