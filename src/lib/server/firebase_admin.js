/**
 * Firebase Admin SDK 초기화
 * 서버 사이드에서 FCM 푸시 알림을 보내기 위한 설정
 */

import admin from 'firebase-admin';

let firebase_app = null;

/**
 * Firebase Admin SDK 초기화 (한 번만 실행)
 */
export function initialize_firebase_admin() {
	if (firebase_app) {
		return firebase_app;
	}

	try {
		// 환경 변수에서 서비스 계정 키 가져오기
		const service_account = {
			type: 'service_account',
			project_id: process.env.FIREBASE_PROJECT_ID,
			private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
			private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
			client_email: process.env.FIREBASE_CLIENT_EMAIL,
			client_id: process.env.FIREBASE_CLIENT_ID,
			auth_uri: 'https://accounts.google.com/o/oauth2/auth',
			token_uri: 'https://oauth2.googleapis.com/token',
			auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
			client_x509_cert_url: process.env.FIREBASE_CLIENT_CERT_URL
		};

		firebase_app = admin.initializeApp({
			credential: admin.credential.cert(service_account)
		});

		console.log('✅ Firebase Admin SDK initialized');
		return firebase_app;
	} catch (error) {
		console.error('❌ Firebase Admin SDK initialization failed:', error);
		throw error;
	}
}

/**
 * Firebase Admin 앱 가져오기
 */
export function get_firebase_admin() {
	if (!firebase_app) {
		return initialize_firebase_admin();
	}
	return firebase_app;
}

/**
 * FCM Messaging 인스턴스 가져오기
 */
export function get_messaging() {
	const app = get_firebase_admin();
	return admin.messaging(app);
}
