/**
 * Creates reactive service data state manager
 * @param {Object} initialData - Initial data
 * @param {Array} initialData.services - Initial services array
 * @param {Array} initialData.service_likes - Initial service likes array
 * @param {Object} api - API instance for service operations
 * @returns {Object} Service data manager with reactive state and methods
 */
export function create_service_data(initialData, api) {
	let services = $state(initialData.services);
	let serviceLikes = $state(initialData.service_likes);
	let isInfiniteLoading = $state(false);

	/**
	 * Loads more services for infinite scroll
	 * @param {string} lastServiceId - ID of the last loaded service
	 * @returns {Promise<Array>} Array of additional services
	 */
	const loadMoreServices = async (lastServiceId) => {
		return await api.services.select_infinite_scroll(lastServiceId);
	};

	return {
		get services() {
			return services;
		},
		set services(value) {
			services = value;
		},
		get serviceLikes() {
			return serviceLikes;
		},
		set serviceLikes(value) {
			serviceLikes = value;
		},
		get isInfiniteLoading() {
			return isInfiniteLoading;
		},
		set isInfiniteLoading(value) {
			isInfiniteLoading = value;
		},
		loadMoreServices,
	};
}
