import { enhancedImages } from '@sveltejs/enhanced-img';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { svelteTesting } from '@testing-library/svelte/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		tailwindcss(),
		enhancedImages(),
		sveltekit(),
		// 추가 압축이 필요하면: npm install -D vite-plugin-compression
		// Vercel은 자동으로 gzip/brotli 압축을 제공합니다
	],
	server: {
		allowedHosts: ['1e49f49088ad.ngrok-free.app'],
	},
	build: {
		chunkSizeWarningLimit: 1000,
		cssCodeSplit: true,
		cssMinify: true,
		rollupOptions: {
			onwarn(warning, warn) {
				if (warning.code === 'CIRCULAR_DEPENDENCY' && warning.message.includes('node_modules/svelte')) {
					return;
				}
				warn(warning);
			},
			output: {
				manualChunks(id) {
					if (id.includes('node_modules')) {
						// 큰 라이브러리를 세밀하게 분리
						if (id.includes('@tiptap')) return 'tiptap';
						if (id.includes('xlsx')) return 'xlsx';
						if (id.includes('@supabase')) return 'supabase';
						if (id.includes('svelte-remixicon')) return 'icons';
						if (id.includes('daisyui')) return 'daisyui';
						// 나머지 vendor 라이브러리
						return 'vendor';
					}
				},
				// Asset 파일명 최적화 (캐시 효율성)
				assetFileNames: (assetInfo) => {
					const info = assetInfo.name.split('.');
					const extType = info[info.length - 1];
					if (/png|jpe?g|svg|gif|tiff|bmp|ico|webp/i.test(extType)) {
						return `assets/images/[name]-[hash][extname]`;
					} else if (/woff|woff2|eot|ttf|otf/i.test(extType)) {
						return `assets/fonts/[name]-[hash][extname]`;
					}
					return `assets/[name]-[hash][extname]`;
				},
			},
			treeshake: {
				moduleSideEffects: 'no-external',
				propertyReadSideEffects: false,
			},
		},
		sourcemap: false,
		// 기본 esbuild minify (안전하고 빠름)
		minify: 'esbuild',
		target: 'es2020',
	},
	test: {
		workspace: [
			{
				extends: './vite.config.js',
				plugins: [svelteTesting()],
				test: {
					name: 'client',
					environment: 'jsdom',
					clearMocks: true,
					include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
					exclude: ['src/lib/server/**'],
					setupFiles: ['./vitest-setup-client.js'],
				},
			},

			{
				extends: './vite.config.js',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/**/*.svelte.{test,spec}.{js,ts}'],
				},
			},
		],
	},
});
