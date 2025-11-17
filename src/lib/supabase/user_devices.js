/**
 * user_devices 테이블 API
 * FCM 토큰 관리 (디바이스 등록, 조회, 삭제)
 */

export function create_user_devices_api(supabase) {
	return {
		/**
		 * 디바이스 FCM 토큰 등록/업데이트
		 * 이미 존재하는 토큰이면 updated_at만 갱신
		 */
		upsert: async ({ user_id, fcm_token, device_type = null, device_name = null }) => {
			const { data, error } = await supabase
				.from('user_devices')
				.upsert(
					{
						user_id,
						fcm_token,
						device_type,
						device_name,
						updated_at: new Date().toISOString()
					},
					{
						onConflict: 'fcm_token', // fcm_token이 UNIQUE이므로 충돌 시 업데이트
						ignoreDuplicates: false
					}
				)
				.select()
				.single();

			if (error) {
				console.error('Failed to upsert device:', error);
				throw new Error('디바이스 등록에 실패했습니다');
			}

			return data;
		},

		/**
		 * 사용자의 모든 디바이스 조회
		 */
		select_by_user_id: async (user_id) => {
			const { data, error } = await supabase
				.from('user_devices')
				.select('*')
				.eq('user_id', user_id)
				.order('updated_at', { ascending: false });

			if (error) {
				console.error('Failed to fetch devices:', error);
				return [];
			}

			return data;
		},

		/**
		 * 특정 디바이스 삭제 (로그아웃 시)
		 */
		delete_by_token: async (fcm_token) => {
			const { error } = await supabase.from('user_devices').delete().eq('fcm_token', fcm_token);

			if (error) {
				console.error('Failed to delete device:', error);
				throw new Error('디바이스 삭제에 실패했습니다');
			}

			return true;
		},

		/**
		 * 여러 디바이스 삭제 (만료된 토큰들)
		 */
		delete_by_tokens: async (fcm_tokens) => {
			const { error } = await supabase.from('user_devices').delete().in('fcm_token', fcm_tokens);

			if (error) {
				console.error('Failed to delete devices:', error);
				return false;
			}

			return true;
		},

		/**
		 * 사용자의 모든 디바이스 삭제 (계정 삭제 시)
		 */
		delete_by_user_id: async (user_id) => {
			const { error } = await supabase.from('user_devices').delete().eq('user_id', user_id);

			if (error) {
				console.error('Failed to delete user devices:', error);
				throw new Error('디바이스 삭제에 실패했습니다');
			}

			return true;
		}
	};
}
