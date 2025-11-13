/**
 * 푸시 알림 토큰 등록 (네이티브 앱 전용)
 * Capacitor Push Notifications 플러그인 사용
 */

import { PushNotifications } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

/**
 * FCM 토큰 등록 (Android/iOS)
 * @param {object} api - Supabase API 객체
 * @param {string} user_id - 사용자 ID
 */
export async function register_fcm_token(api, user_id) {
	if (!user_id) {
		console.warn('⚠️ User ID not provided, skipping FCM registration');
		return;
	}

	const platform = Capacitor.getPlatform();

	// 웹 브라우저는 지원 안 함
	if (platform === 'web') {
		console.log('ℹ️ Push notifications not supported on web platform');
		return;
	}

	try {
		// 1. 푸시 알림 권한 요청
		const permission = await PushNotifications.requestPermissions();

		if (permission.receive !== 'granted') {
			console.warn('⚠️ Push notification permission denied');
			return;
		}

		// 2. 푸시 알림 등록
		await PushNotifications.register();

		// 3. 토큰 수신 리스너
		PushNotifications.addListener('registration', async (token) => {
			console.log('✅ FCM token received:', token.value);

			try {
				// Supabase에 토큰 저장
				await api.user_devices.upsert({
					user_id,
					fcm_token: token.value,
					device_type: platform, // 'android' 또는 'ios'
					device_name: platform === 'android' ? 'Android Device' : 'iOS Device'
				});
				console.log('✅ FCM token saved to database');
			} catch (error) {
				console.error('❌ Failed to save FCM token:', error);
			}
		});

		// 4. 토큰 등록 실패 리스너
		PushNotifications.addListener('registrationError', (error) => {
			console.error('❌ FCM registration error:', error);
		});

		// 5. 알림 수신 리스너 (앱 실행 중)
		PushNotifications.addListener('pushNotificationReceived', (notification) => {
			console.log('📩 Push notification received:', notification);
			// 필요시 UI 업데이트 (알림 배지 카운트 증가 등)
		});

		// 6. 알림 클릭 리스너
		PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
			console.log('👆 Push notification clicked:', notification);

			// 딥링크 처리
			const link_url = notification.notification.data?.link_url;
			if (link_url) {
				window.location.href = link_url;
			}
		});

		console.log('✅ Push notifications initialized');
	} catch (error) {
		console.error('❌ Failed to register FCM token:', error);
	}
}

/**
 * FCM 토큰 삭제 (로그아웃 시)
 * @param {object} api - Supabase API 객체
 */
export async function unregister_fcm_token(api) {
	try {
		const platform = Capacitor.getPlatform();

		if (platform === 'web') {
			return;
		}

		// 푸시 알림 리스너 제거
		await PushNotifications.removeAllListeners();

		console.log('✅ FCM token unregistered');
	} catch (error) {
		console.error('❌ Failed to unregister FCM token:', error);
	}
}
