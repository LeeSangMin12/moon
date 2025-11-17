/**
 * notification_settings 테이블 API
 * 사용자별 알림 설정 관리
 */

export function create_notification_settings_api(supabase) {
	return {
		/**
		 * 사용자의 알림 설정 조회
		 */
		select_by_user_id: async (user_id) => {
			const { data, error } = await supabase
				.from('notification_settings')
				.select('*')
				.eq('user_id', user_id)
				.single();

			if (error) {
				// 설정이 없으면 기본값 반환
				if (error.code === 'PGRST116') {
					return {
						push_enabled: true,
						post_liked: true,
						comment_created: true,
						comment_reply: true,
						follow_created: true,
						order_created: true,
						order_approved: true,
						order_completed: true,
						review_created: true,
						expert_review_created: true,
						proposal_accepted: true,
						gift_received: true,
						coffee_chat_requested: true,
						coffee_chat_accepted: true,
						coffee_chat_rejected: true
					};
				}
				console.error('Failed to fetch notification settings:', error);
				return null;
			}

			return data;
		},

		/**
		 * 알림 설정 업데이트
		 */
		update: async (user_id, settings) => {
			const { data, error } = await supabase
				.from('notification_settings')
				.upsert(
					{
						user_id,
						...settings,
						updated_at: new Date().toISOString()
					},
					{
						onConflict: 'user_id'
					}
				)
				.select()
				.single();

			if (error) {
				console.error('Failed to update notification settings:', error);
				throw new Error('알림 설정 업데이트에 실패했습니다');
			}

			return data;
		},

		/**
		 * 푸시 알림 전체 on/off
		 */
		toggle_push: async (user_id, enabled) => {
			const { data, error } = await supabase
				.from('notification_settings')
				.update({ push_enabled: enabled })
				.eq('user_id', user_id)
				.select()
				.single();

			if (error) {
				console.error('Failed to toggle push notifications:', error);
				throw new Error('푸시 알림 설정 변경에 실패했습니다');
			}

			return data;
		},

		/**
		 * 특정 알림 타입 on/off
		 */
		toggle_type: async (user_id, type, enabled) => {
			const type_key = type.replace('.', '_'); // "post.liked" -> "post_liked"

			const { data, error } = await supabase
				.from('notification_settings')
				.update({ [type_key]: enabled })
				.eq('user_id', user_id)
				.select()
				.single();

			if (error) {
				console.error('Failed to toggle notification type:', error);
				throw new Error('알림 타입 설정 변경에 실패했습니다');
			}

			return data;
		}
	};
}
