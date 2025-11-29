/**
 * 인증 API (OTP, 전화번호 인증)
 */
export const create_auth_api = (supabase) => ({
	/**
	 * Twilio Verify를 통해 OTP 전송
	 *
	 * @param {string} phone - 전화번호 (국제 형식: +821012345678)
	 * @returns {Promise<Object>} OTP 전송 결과
	 * @throws {Error} OTP 전송 실패 시
	 */
	send_otp: async (phone) => {
		const { data, error } = await supabase.functions.invoke('sms-otp', {
			body: { action: 'send', phone },
		});

		if (error) throw new Error(`Failed to send_otp: ${error.message}`);
		if (!data.success) throw new Error(data.error || 'Failed to send OTP');
		return data;
	},

	/**
	 * Twilio Verify를 통해 OTP 검증
	 *
	 * @param {string} phone - 전화번호 (국제 형식: +821012345678)
	 * @param {string} code - 6자리 OTP 코드
	 * @returns {Promise<Object>} 검증 결과
	 * @throws {Error} OTP 검증 실패 시
	 */
	verify_otp: async (phone, code) => {
		const { data, error } = await supabase.functions.invoke('sms-otp', {
			body: { action: 'verify', phone, code },
		});

		if (error) throw new Error(`Failed to verify_otp: ${error.message}`);
		if (!data.success) throw new Error(data.error || 'Invalid code');
		return data;
	},

	/**
	 * 전화번호 중복 확인 (회원가입 시 사용)
	 *
	 * @param {string} phone - 확인할 전화번호
	 * @returns {Promise<boolean>} 중복 여부 (true: 이미 존재, false: 사용 가능)
	 * @throws {Error} 쿼리 실패 시
	 */
	check_phone_exists: async (phone) => {
		const { data, error } = await supabase
			.from('users')
			.select('phone')
			.eq('phone', phone)
			.maybeSingle();

		if (error)
			throw new Error(`Failed to check_phone_exists: ${error.message}`);
		return !!data;
	},

	/**
	 * 한국 전화번호를 국제 형식으로 변환
	 *
	 * @param {string} phone - 한국 전화번호 (예: 010-1234-5678 또는 01012345678)
	 * @returns {string} 국제 형식 전화번호 (+821012345678)
	 */
	format_to_international: (phone) => {
		// 하이픈 제거
		const cleaned = phone.replace(/-/g, '');
		// 010 → +8210으로 변환
		if (cleaned.startsWith('010')) {
			return '+82' + cleaned.substring(1);
		}
		// 이미 +82로 시작하면 그대로 반환
		if (cleaned.startsWith('+82')) {
			return cleaned;
		}
		// 기타 경우 +82 추가
		return '+82' + cleaned;
	},

	/**
	 * 국제 형식 전화번호를 한국 형식으로 변환
	 *
	 * @param {string} international_phone - 국제 형식 전화번호 (+821012345678)
	 * @returns {string} 한국 형식 전화번호 (010-1234-5678)
	 */
	format_to_local: (international_phone) => {
		// +82 제거
		const without_prefix = international_phone.replace(/^\+82/, '0');
		// 하이픈 추가 (010-1234-5678)
		if (without_prefix.length === 11) {
			return `${without_prefix.substring(0, 3)}-${without_prefix.substring(3, 7)}-${without_prefix.substring(7)}`;
		}
		return without_prefix;
	},
});
