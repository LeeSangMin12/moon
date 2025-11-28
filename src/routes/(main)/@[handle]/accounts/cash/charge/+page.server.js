import { create_api } from '$lib/supabase/api.js';

export async function load({ parent, locals: { supabase } }) {
	const { user } = await parent();
	const api = create_api(supabase);

	const pending_charges = await api.cash_charges.select_pending_by_user_id(user.id);

	return {
		pending_charges,
	};
}
