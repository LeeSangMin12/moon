/**
 * 푸시 알림 발송 함수
 * Firebase Cloud Messaging을 통해 푸시 알림 전송
 */

import { get_messaging } from './firebase_admin.js';
import { create_push_message } from '$lib/utils/notification_templates.js';
import { create_api } from '$lib/supabase/api.js';

/**
 * 푸시 알림 발송 (단일 사용자)
 * @param {object} supabase - Supabase 클라이언트
 * @param {string} recipient_id - 수신자 사용자 ID
 * @param {string} type - 알림 타입 (예: "post.liked")
 * @param {string} actor_name - 행동 주체 이름
 * @param {object} payload - 알림 페이로드
 * @param {string} link_url - 클릭 시 이동할 URL
 * @returns {Promise<{success: number, failed: number}>}
 */
export async function send_push_notification(
	supabase,
	{ recipient_id, type, actor_name, payload = {}, link_url = '' }
) {
	try {
		// 1. 수신자의 알림 설정 확인
		const api = create_api(supabase);
		const notification_settings = await api.notification_settings.select_by_user_id(recipient_id);

		// 푸시 알림이 비활성화되어 있으면 발송 안 함
		if (!notification_settings?.push_enabled) {
			console.log(`📵 Push notifications disabled for user: ${recipient_id}`);
			return { success: 0, failed: 0, skipped: true };
		}

		// 해당 알림 타입이 비활성화되어 있으면 발송 안 함
		const type_key = type.replace('.', '_'); // "post.liked" -> "post_liked"
		if (notification_settings[type_key] === false) {
			console.log(`📵 Push notification type ${type} disabled for user: ${recipient_id}`);
			return { success: 0, failed: 0, skipped: true };
		}

		// 2. 사용자의 모든 디바이스 FCM 토큰 조회
		const devices = await api.user_devices.select_by_user_id(recipient_id);

		if (!devices || devices.length === 0) {
			console.log(`📵 No devices found for user: ${recipient_id}`);
			return { success: 0, failed: 0 };
		}

		// 3. 푸시 메시지 생성
		const push_message = create_push_message(type, actor_name, payload);

		// 4. FCM 메시지 구성
		const fcm_tokens = devices.map((device) => device.fcm_token);

		const message_payload = {
			notification: {
				title: push_message.title,
				body: push_message.body
			},
			data: {
				type,
				link_url,
				payload: JSON.stringify(payload)
			},
			// Android 설정
			android: {
				notification: {
					sound: push_message.sound,
					clickAction: 'FLUTTER_NOTIFICATION_CLICK',
					channelId: 'default'
				}
			},
			// iOS 설정
			apns: {
				payload: {
					aps: {
						sound: push_message.sound,
						badge: 1
					}
				}
			}
		};

		// 5. FCM을 통해 발송 (멀티캐스트)
		const messaging = get_messaging();
		const response = await messaging.sendEachForMulticast({
			tokens: fcm_tokens,
			...message_payload
		});

		console.log(`✅ Push sent: ${response.successCount} success, ${response.failureCount} failed`);

		// 6. 실패한 토큰 처리 (만료된 토큰 삭제)
		if (response.failureCount > 0) {
			const failed_tokens = [];
			response.responses.forEach((resp, idx) => {
				if (!resp.success) {
					const error_code = resp.error?.code;
					// 토큰이 만료되었거나 등록되지 않은 경우 삭제
					if (
						error_code === 'messaging/registration-token-not-registered' ||
						error_code === 'messaging/invalid-registration-token'
					) {
						failed_tokens.push(fcm_tokens[idx]);
					}
				}
			});

			// 실패한 토큰들 삭제
			if (failed_tokens.length > 0) {
				await api.user_devices.delete_by_tokens(failed_tokens);
				console.log(`🗑️ Deleted ${failed_tokens.length} invalid FCM tokens`);
			}
		}

		return {
			success: response.successCount,
			failed: response.failureCount
		};
	} catch (error) {
		console.error('❌ Failed to send push notification:', error);
		return { success: 0, failed: 1, error: error.message };
	}
}

/**
 * 여러 사용자에게 푸시 알림 발송 (배치)
 * @param {object} supabase - Supabase 클라이언트
 * @param {Array} notifications - 알림 배열 [{ recipient_id, type, actor_name, payload, link_url }, ...]
 * @returns {Promise<{total_success: number, total_failed: number}>}
 */
export async function send_push_notifications_batch(supabase, notifications) {
	const results = await Promise.allSettled(
		notifications.map((notification) => send_push_notification(supabase, notification))
	);

	const total_success = results.reduce(
		(sum, result) => sum + (result.status === 'fulfilled' ? result.value.success : 0),
		0
	);
	const total_failed = results.reduce(
		(sum, result) => sum + (result.status === 'fulfilled' ? result.value.failed : 0),
		0
	);

	console.log(
		`✅ Batch push sent: ${total_success} success, ${total_failed} failed (${notifications.length} recipients)`
	);

	return { total_success, total_failed };
}
