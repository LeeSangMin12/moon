import { create_api } from '$lib/supabase/api.js';

export async function load({ parent, locals: { supabase } }) {
	const { user } = await parent();
	const api = create_api(supabase);

	const [transactions, bank_account, pending_charges, pending_withdrawals] = await Promise.all([
		api.cash_transactions.select_by_user_id(user.id, 100),
		api.user_bank_accounts.select_default_by_user_id(user.id),
		api.cash_charges.select_pending_by_user_id(user.id),
		api.cash_withdrawals.select_pending_by_user_id(user.id),
	]);

	return {
		transactions,
		bank_account,
		pending_charges,
		pending_withdrawals,
	};
}
