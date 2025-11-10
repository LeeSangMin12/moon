import adapter from '@sveltejs/adapter-vercel';

export default {
	kit: {
		adapter: adapter({
			// Vercel Edge Runtime 최적화
			runtime: 'nodejs20.x',
		}),
		// Prerender 설정 (정적 페이지 미리 생성)
		prerender: {
			handleHttpError: 'warn',
			handleMissingId: 'warn',
			origin: 'https://moon.it.kr',
		},
	},
};
