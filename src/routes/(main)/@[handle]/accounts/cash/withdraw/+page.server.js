import { create_api } from '$lib/supabase/api.js';

export async function load({ parent, locals: { supabase } }) {
	const { user } = await parent();
	const api = create_api(supabase);

	const [bank_account, pending_withdrawals] = await Promise.all([
		api.user_bank_accounts.select_default_by_user_id(user.id),
		api.cash_withdrawals.select_pending_by_user_id(user.id),
	]);

	return {
		bank_account,
		pending_withdrawals,
	};
}
