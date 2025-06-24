import adapter from '@sveltejs/adapter-vercel';

export default {
	kit: {
		adapter: adapter({})
	},
	// svelte-carousel 사용시 필요
	vite: {
		optimizeDeps: {
			include: ['lodash.get', 'lodash.isequal', 'lodash.clonedeep']
		}
	}
};
