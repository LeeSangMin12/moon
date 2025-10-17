import { create_api } from '$lib/supabase/api';

export async function load({ params, url, parent, locals: { supabase } }) {
	const api = create_api(supabase);

	const { user } = await parent();

	// 서비스 정보
	const service = await api.services.select_by_id(params.id);

	// 쿼리 파라미터에서 선택 정보 가져오기
	const quantity = parseInt(url.searchParams.get('quantity') || '1');
	const selected_option_ids = url.searchParams.get('options')
		? url.searchParams.get('options').split(',').map(id => parseInt(id))
		: [];

	// 선택된 옵션 정보 가져오기
	const service_options = await api.service_options.select_by_service_id(params.id);
	const selected_options = service_options.filter(opt => selected_option_ids.includes(opt.id));

	return {
		service,
		quantity,
		selected_options,
	};
}
