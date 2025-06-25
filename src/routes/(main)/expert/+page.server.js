import { create_api } from '$lib/supabase/api';

export async function load({ params, parent, locals: { supabase } }) {
	const api = create_api(supabase);

	const services = await api.services.select();

	return {
		services,
	};
}
