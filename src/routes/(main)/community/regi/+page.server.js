import { create_api } from '$lib/supabase/api';

export async function load({ url, params, parent, locals: { supabase } }) {
	const api = create_api(supabase);

	const slug = url.searchParams.get('slug');

	let community = null;

	if (slug) {
		community = await api.communities.select_by_slug_with_topics(slug);
	}

	const topic_categories =
		await api.topics.select_topic_categories_with_topics();

	return {
		topic_categories,
		community,
	};
}
