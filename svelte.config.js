import adapter from '@sveltejs/adapter-vercel';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			// Vercel 배포를 위한 추가 설정
			runtime: 'nodejs18.x',
		}),
	},
	// svelte-carousel 사용시 필요
	vite: {
		optimizeDeps: {
			include: ['lodash.get', 'lodash.isequal', 'lodash.clonedeep'],
		},
	},
};

export default config;
