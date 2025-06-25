import { create_api } from '$lib/supabase/api';

export async function load({ params, parent, locals: { supabase } }) {
	const api = create_api(supabase);

	const service = await api.services.select_by_id(params.id);

	return {
		service,
	};
}
