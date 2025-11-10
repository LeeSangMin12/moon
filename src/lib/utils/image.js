/**
 * 이미지 최적화 유틸리티
 * Supabase Storage 이미지를 최적화하여 로드
 */

import profile_png from '$lib/img/common/user/profile.png';
import logo from '$lib/img/logo.png';

/**
 * Supabase Storage 이미지 URL을 최적화된 형식으로 변환
 *
 * @param {string|null|undefined} url - 원본 이미지 URL
 * @param {Object} options - 최적화 옵션
 * @param {number} [options.width=800] - 이미지 너비
 * @param {number|null} [options.height] - 이미지 높이
 * @param {number} [options.quality=80] - 이미지 품질 0-100
 * @param {string} [options.fallback] - URL이 없을 때 대체 이미지
 * @returns {string} 최적화된 이미지 URL
 */
export function optimize_image(url, options = {}) {
	const {
		width = 800,
		height = null,
		quality = 80,
		fallback = logo
	} = options;

	if (!url) return fallback;

	// Supabase Storage URL인 경우에만 최적화 적용
	if (url.includes('supabase.co/storage')) {
		const params = new URLSearchParams();

		if (width) params.append('width', width.toString());
		if (height) params.append('height', height.toString());
		params.append('quality', quality.toString());
		params.append('resize', 'contain');

		return `${url}?${params.toString()}`;
	}

	return url;
}

/**
 * 아바타 이미지 최적화
 *
 * @param {string|null|undefined} url - 아바타 URL
 * @returns {string} 최적화된 URL
 */
export function optimize_avatar(url) {
	return optimize_image(url, {
		width: 200,
		height: 200,
		quality: 85,
		fallback: profile_png
	});
}

/**
 * 썸네일 이미지 최적화
 *
 * @param {string|null|undefined} url - 썸네일 URL
 * @returns {string} 최적화된 URL
 */
export function optimize_thumbnail(url) {
	return optimize_image(url, {
		width: 400,
		quality: 80,
		fallback: logo
	});
}

/**
 * 풀 사이즈 이미지 최적화
 *
 * @param {string|null|undefined} url - 이미지 URL
 * @returns {string} 최적화된 URL
 */
export function optimize_full_image(url) {
	return optimize_image(url, {
		width: 1200,
		quality: 85,
		fallback: logo
	});
}

/**
 * 반응형 이미지 srcset 생성
 *
 * @param {string|null|undefined} url - 원본 이미지 URL
 * @returns {string} srcset 문자열
 */
export function create_srcset(url) {
	if (!url || !url.includes('supabase.co/storage')) return '';

	const sizes = [400, 800, 1200, 1600];
	return sizes
		.map(size => `${optimize_image(url, { width: size })} ${size}w`)
		.join(', ');
}
