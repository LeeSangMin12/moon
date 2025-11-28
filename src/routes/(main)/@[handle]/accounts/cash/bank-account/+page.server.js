import { create_api } from '$lib/supabase/api.js';

export async function load({ parent, locals: { supabase } }) {
	const { user } = await parent();
	const api = create_api(supabase);

	const bank_accounts = await api.user_bank_accounts.select_by_user_id(user.id);

	return {
		bank_accounts,
	};
}
