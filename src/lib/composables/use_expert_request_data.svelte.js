/**
 * 외주 요청 데이터 관리 composable
 * @param {Object} initial_data - 초기 데이터
 * @param {Array} initial_data.expert_requests - 외주 요청 목록
 * @param {Object} api - Supabase API 객체
 * @param {string} job_type - 작업 유형 ('sidejob' | 'fulltime')
 * @returns {Object} 외주 요청 데이터 및 관련 메서드
 */
export function create_expert_request_data(initial_data, api, job_type) {
	let expert_requests = $state(initial_data.expert_requests);
	let is_infinite_loading = $state(false);

	/**
	 * 무한 스크롤 로드 함수
	 * @param {string} last_request_id - 마지막 요청 ID
	 * @returns {Promise<Array>} 추가 외주 요청 목록
	 */
	const load_more_expert_requests = async (last_request_id) => {
		const response = await api.expert_requests.select_infinite_scroll(
			last_request_id,
			'',
			20,
			job_type
		);
		return response.data || response;
	};

	return {
		get expert_requests() {
			return expert_requests;
		},
		set expert_requests(value) {
			expert_requests = value;
		},
		get is_infinite_loading() {
			return is_infinite_loading;
		},
		set is_infinite_loading(value) {
			is_infinite_loading = value;
		},
		load_more_expert_requests,
	};
}
