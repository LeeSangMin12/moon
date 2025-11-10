/**
 * 이미지 최적화 유틸리티
 * Supabase Storage 이미지를 최적화하여 로드
 */

/**
 * Supabase Storage 이미지 URL을 최적화된 형식으로 변환
 * @param {string|null|undefined} url - 원본 이미지 URL
 * @param {object} options - 최적화 옵션
 * @param {number} options.width - 이미지 너비 (기본: 800)
 * @param {number} options.height - 이미지 높이 (선택)
 * @param {number} options.quality - 이미지 품질 0-100 (기본: 80)
 * @param {string} options.format - 이미지 포맷 (기본: 'webp')
 * @param {string} options.fallback - URL이 없을 때 대체 이미지
 * @returns {string} 최적화된 이미지 URL
 */
export function optimize_image(url, options = {}) {
	const {
		width = 800,
		height = null,
		quality = 80,
		format = 'webp',
		fallback = '/favicon.png'
	} = options;

	// URL이 없으면 fallback 반환
	if (!url) return fallback;

	// Supabase Storage URL 확인
	if (url.includes('supabase.co/storage')) {
		const params = new URLSearchParams();

		if (width) params.append('width', width.toString());
		if (height) params.append('height', height.toString());
		params.append('quality', quality.toString());

		// Supabase는 format 파라미터를 지원하지 않을 수 있으므로 조건부 추가
		// 대신 resize 파라미터 사용
		params.append('resize', 'contain');

		return `${url}?${params.toString()}`;
	}

	// 외부 URL이나 상대 경로는 그대로 반환
	return url;
}

/**
 * 아바타 이미지 최적화 (작은 크기)
 * @param {string|null} url - 아바타 URL
 * @returns {string} 최적화된 URL
 */
export function optimize_avatar(url) {
	return optimize_image(url, {
		width: 200,
		height: 200,
		quality: 85,
		fallback: '/favicon.png'
	});
}

/**
 * 썸네일 이미지 최적화 (중간 크기)
 * @param {string|null} url - 썸네일 URL
 * @returns {string} 최적화된 URL
 */
export function optimize_thumbnail(url) {
	return optimize_image(url, {
		width: 400,
		quality: 80,
		fallback: '/favicon.png'
	});
}

/**
 * 풀 사이즈 이미지 최적화 (큰 크기)
 * @param {string|null} url - 이미지 URL
 * @returns {string} 최적화된 URL
 */
export function optimize_full_image(url) {
	return optimize_image(url, {
		width: 1200,
		quality: 85
	});
}

/**
 * srcset 생성 (반응형 이미지)
 * @param {string|null} url - 원본 이미지 URL
 * @returns {string} srcset 문자열
 */
export function create_srcset(url) {
	if (!url || !url.includes('supabase.co/storage')) return '';

	const sizes = [400, 800, 1200, 1600];
	return sizes
		.map(size => `${optimize_image(url, { width: size })} ${size}w`)
		.join(', ');
}
