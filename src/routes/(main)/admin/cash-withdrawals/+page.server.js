import { create_api } from '$lib/supabase/api';

export const load = async ({ locals: { supabase } }) => {
	const api = create_api(supabase);

	const [pending_withdrawals, recent_withdrawals] = await Promise.all([
		api.cash_withdrawals.select_all_pending(),
		api.cash_withdrawals.select_all(null, 30),
	]);

	return {
		pending_withdrawals: pending_withdrawals || [],
		recent_withdrawals: recent_withdrawals.filter((w) => w.status !== 'pending') || [],
	};
};
