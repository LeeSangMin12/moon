import { create_api } from '$lib/supabase/api';

export const load = async ({ params, parent, locals: { supabase }, url }) => {
	const { post_id } = params;
	const { user } = await parent();

	const api = create_api(supabase);

	const post = await api.posts.select_by_id(post_id);
	const comments = await api.post_comments.select_by_post_id(post_id, user?.id);

	// 이미지 URL 검증 함수
	const is_video = (uri) => {
		return /\.(mp4|mov|webm|ogg)$/i.test(uri);
	};

	// 유효한 이미지 URL인지 확인
	const get_valid_image_url = (images) => {
		if (!images || images.length === 0) return null;

		const first_image = images[0];
		if (!first_image.uri || is_video(first_image.uri)) return null;

		let image_url = first_image.uri;

		// 상대 경로인 경우 절대 경로로 변환
		if (image_url.startsWith('/')) {
			image_url = `${url.origin}${image_url}`;
		}

		// URL이 유효한지 확인 (프로토콜 포함)
		if (!image_url.startsWith('http://') && !image_url.startsWith('https://')) {
			return null;
		}

		// 이미지 파일 확장자 확인 (선택적)
		const valid_image_extensions = /\.(jpg|jpeg|png|gif|webp|svg)$/i;
		if (!valid_image_extensions.test(image_url)) {
			console.warn(
				'Image URL does not have a valid image extension:',
				image_url,
			);
		}

		return image_url;
	};

	const image_url = get_valid_image_url(post.images);
	const post_url = `${url.origin}/@${post.users.handle}/post/${post.id}`;

	const meta = {
		title: post.title || '게시글 | 문',
		description: post.content || '문(Moon)의 소셜 게시글을 확인해보세요.',
		image: image_url,
		url: post_url,
		author: post.users.handle,
	};

	console.log('Generated meta data:', meta);

	return {
		post,
		comments,
		meta,
	};
};
