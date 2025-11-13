import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
	appId: 'kr.it.moon',
	appName: 'Moon',
	webDir: 'build',
	server: {
		url: 'http://192.168.1.137:5173/',
		cleartext: true,
	},
};

export default config;
