import { create_api } from '$lib/supabase/api';

/**
 * Server-side load function for service listing page
 * Implements streaming for optimal performance:
 * - Critical data (services) loads immediately for SSR
 * - Optional data (likes) streams after initial render
 *
 * @param {Object} params - Route parameters
 * @param {Function} parent - Parent layout data loader
 * @param {Object} locals - Server-side locals
 * @param {Object} locals.supabase - Supabase client instance
 * @returns {Promise<Object>} Page data with services and streamed likes
 */
export async function load({ params, parent, locals: { supabase } }) {
	const api = create_api(supabase);
	const { user } = await parent();

	const services = await api.services.select_infinite_scroll('', 10);

	const result = { services };

	if (user?.id) {
		result.service_likes = api.service_likes
			.select_by_user_id(user.id)
			.catch((error) => {
				console.error('Failed to load service likes:', error);
				return [];
			});
	}

	return result;
}
