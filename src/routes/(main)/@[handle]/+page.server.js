import { create_api } from '$lib/supabase/api';

export async function load({ params, parent, locals: { supabase } }) {
	const api = create_api(supabase);
	const { handle } = params;

	const user = await api.users.select_by_handle(handle);

	return { user };
}
