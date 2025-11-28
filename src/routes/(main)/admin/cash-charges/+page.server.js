import { create_api } from '$lib/supabase/api';

export const load = async ({ locals: { supabase } }) => {
	const api = create_api(supabase);

	const [pending_charges, recent_charges] = await Promise.all([
		api.cash_charges.select_all_pending(),
		api.cash_charges.select_all(null, 30),
	]);

	return {
		pending_charges: pending_charges || [],
		recent_charges: recent_charges.filter((c) => c.status !== 'pending') || [],
	};
};
