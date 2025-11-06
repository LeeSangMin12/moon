import { create_api } from '$lib/supabase/api';
import { error } from '@sveltejs/kit';

export const load = async ({ params, parent, locals: { supabase } }) => {
	const { service_id } = params;
	const { user } = await parent();
	const api = create_api(supabase);

	const service = await api.services.select_by_id(service_id);

	// 작성자 확인
	if (service.author_id !== user?.id) {
		error(403, '본인의 서비스만 수정할 수 있습니다.');
	}

	// 서비스 옵션 로드
	const service_options = await api.service_options.select_by_service_id(service_id);

	return { service, service_options };
};
