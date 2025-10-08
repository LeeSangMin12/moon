import { enhancedImages } from '@sveltejs/enhanced-img';
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { svelteTesting } from '@testing-library/svelte/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), enhancedImages(), sveltekit()],
	server: {
		allowedHosts: ['1e49f49088ad.ngrok-free.app'],
	},
	build: {
		rollupOptions: {
			onwarn(warning, warn) {
				// Suppress circular dependency warnings from Svelte internals
				if (warning.code === 'CIRCULAR_DEPENDENCY' && warning.message.includes('node_modules/svelte')) {
					return;
				}
				warn(warning);
			}
		}
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
