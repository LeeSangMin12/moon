import { create_api } from '$lib/supabase/api';

export async function load({ params, parent, locals: { supabase } }) {
	const { user } = await parent();
	const api = create_api(supabase);

	const moon_withdrawals = await api.moon_withdrawals.select_by_user_id(
		user.id,
	);
	const moon_point_transactions =
		await api.moon_point_transactions.select_by_user_id(user.id);

	return {
		moon_point_transactions,
		moon_withdrawals,
	};
}
