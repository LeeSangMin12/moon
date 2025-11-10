export function create_expert_request_data(initialData, api) {
	let expertRequests = $state(initialData.expert_requests);
	let searchText = $state('');
	let selectedCategory = $state('');
	let isInfiniteLoading = $state(false);

	const searchExpertRequests = async () => {
		if (searchText.trim()) {
			expertRequests = await api.expert_requests.select_by_search(searchText);
		} else {
			const response = await api.expert_requests.select_infinite_scroll('', selectedCategory);
			expertRequests = response.data || response;
		}
	};

	const loadMoreExpertRequests = async (lastRequestId) => {
		const response = await api.expert_requests.select_infinite_scroll(
			lastRequestId,
			selectedCategory
		);
		return response.data || response;
	};

	const filterByCategory = async (category) => {
		selectedCategory = category;
		const response = await api.expert_requests.select_infinite_scroll('', category);
		expertRequests = response.data || response;
	};

	return {
		get expertRequests() { return expertRequests; },
		set expertRequests(value) { expertRequests = value; },
		get searchText() { return searchText; },
		set searchText(value) { searchText = value; },
		get selectedCategory() { return selectedCategory; },
		get isInfiniteLoading() { return isInfiniteLoading; },
		set isInfiniteLoading(value) { isInfiniteLoading = value; },
		searchExpertRequests,
		loadMoreExpertRequests,
		filterByCategory
	};
}
