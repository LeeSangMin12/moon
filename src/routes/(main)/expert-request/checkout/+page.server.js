import { create_api } from '$lib/supabase/api';
import { redirect, error } from '@sveltejs/kit';

export async function load({ url, parent, locals: { supabase } }) {
	const { user } = await parent();

	if (!user) {
		throw redirect(302, '/auth');
	}

	const request_id = url.searchParams.get('request_id');

	if (!request_id) {
		throw error(400, '요청 ID가 필요합니다.');
	}

	const api = create_api(supabase);

	try {
		const request = await api.expert_requests.select_by_id(parseInt(request_id));

		if (!request) {
			throw error(404, '요청을 찾을 수 없습니다.');
		}

		// 요청 작성자가 아니면 접근 불가
		if (request.requester_id !== user.id) {
			throw error(403, '권한이 없습니다.');
		}

		// 이미 결제된 요청이면 리다이렉트
		if (request.is_paid) {
			throw redirect(302, `/expert-request/${request_id}`);
		}

		return {
			user,
			request
		};
	} catch (err) {
		console.error('Expert request checkout load error:', err);
		throw error(500, '요청을 불러오는 중 오류가 발생했습니다.');
	}
}
