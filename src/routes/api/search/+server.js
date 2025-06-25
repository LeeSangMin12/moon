import { json } from '@sveltejs/kit';
import { create_api } from '$lib/supabase/api';

export async function GET(event) {
	const {
		url,
		locals: { supabase },
	} = event;
	const q = url.searchParams.get('q') ?? '';
	const type = url.searchParams.get('type') ?? 'post';
	const api = create_api(supabase);

	let results = [];

	if (!q) return json([]);

	if (type === 'post') {
		const { data, error } = await supabase
			.from('posts')
			.select('id, title, content')
			.ilike('title', `%${q}%`)
			.limit(20);
		if (error) throw new Error(error.message);
		results = data.map((post) => ({
			id: post.id,
			title: post.title,
			type: 'post',
		}));
	} else if (type === 'community') {
		const { data, error } = await supabase
			.from('communities')
			.select('id, title, slug')
			.ilike('title', `%${q}%`)
			.limit(20);
		if (error) throw new Error(error.message);
		results = data.map((community) => ({
			id: community.id,
			title: community.title,
			type: 'community',
		}));
	} else if (type === 'profile') {
		const { data, error } = await supabase
			.from('users')
			.select('id, name, handle')
			.or(`name.ilike.%${q}%,handle.ilike.%${q}%`)
			.limit(20);
		if (error) throw new Error(error.message);
		results = data.map((user) => ({
			id: user.id,
			title: user.name || user.handle,
			handle: user.handle,
			type: 'profile',
		}));
	} else if (type === 'service') {
		// 서비스 검색은 별도 테이블/로직 필요. 일단 빈 배열 반환
		results = [];
	}

	return json(results);
}
