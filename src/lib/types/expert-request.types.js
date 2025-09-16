// 전문가 요청 시스템 타입 정의
// JSDoc을 사용한 TypeScript 스타일 타입 정의

/**
 * 요청 상태 타입
 * @typedef {'open' | 'in_progress' | 'completed' | 'cancelled'} RequestStatus
 */

/**
 * 제안 상태 타입
 * @typedef {'pending' | 'accepted' | 'rejected'} ProposalStatus
 */

/**
 * 카테고리 타입
 * @typedef {'웹개발/프로그래밍' | '모바일 앱 개발' | '디자인' | '마케팅/광고' | '글쓰기/콘텐츠' | '번역/통역' | '영상/사진' | '음악/사운드' | '비즈니스 컨설팅' | '기타'} RequestCategory
 */

/**
 * 사용자 정보 타입
 * @typedef {Object} UserInfo
 * @property {string} id - 사용자 ID
 * @property {string} handle - 사용자 핸들
 * @property {string} name - 사용자 이름
 * @property {string|null} avatar_url - 프로필 이미지 URL
 */

/**
 * 전문가 요청 타입
 * @typedef {Object} ExpertRequest
 * @property {number} id - 요청 ID
 * @property {string} title - 제목 (10-100자)
 * @property {string} description - 상세 설명 (50-2000자)
 * @property {RequestCategory} category - 카테고리
 * @property {number} reward_amount - 보상금
 * @property {string|null} application_deadline - 모집 마감일 (ISO 날짜 문자열)
 * @property {string|null} work_start_date - 업무 예상 시작일 (ISO 날짜 문자열)
 * @property {string|null} work_end_date - 업무 예상 종료일 (ISO 날짜 문자열)
 * @property {number} max_applicants - 모집인원
 * @property {string} work_location - 근무지
 * @property {RequestStatus} status - 요청 상태
 * @property {string} requester_id - 요청자 ID
 * @property {string} created_at - 생성일 (ISO 날짜 문자열)
 * @property {string} updated_at - 수정일 (ISO 날짜 문자열)
 * @property {string|null} deleted_at - 삭제일 (ISO 날짜 문자열)
 * @property {UserInfo} users - 요청자 정보
 * @property {ExpertRequestProposal[]} expert_request_proposals - 제안서 목록
 */

/**
 * 전문가 요청 제안서 타입
 * @typedef {Object} ExpertRequestProposal
 * @property {number} id - 제안서 ID
 * @property {number} request_id - 요청 ID
 * @property {string} expert_id - 전문가 ID
 * @property {string} message - 제안 메시지 (50-1000자)
 * @property {number|null} proposed_budget - 제안 예산
 * @property {string|null} proposed_timeline - 예상 작업 기간 (최대 100자)
 * @property {ProposalStatus} status - 제안 상태
 * @property {string} created_at - 생성일 (ISO 날짜 문자열)
 * @property {string} updated_at - 수정일 (ISO 날짜 문자열)
 * @property {UserInfo} users - 전문가 정보
 * @property {ExpertRequest} expert_requests - 요청 정보
 */

/**
 * 요청 생성/수정 폼 데이터
 * @typedef {Object} RequestFormData
 * @property {string} title - 제목
 * @property {string} description - 상세 설명
 * @property {RequestCategory} category - 카테고리
 * @property {string} reward_amount - 보상금 (문자열)
 * @property {string} application_deadline - 모집 마감일
 * @property {string} work_start_date - 업무 예상 시작일
 * @property {string} work_end_date - 업무 예상 종료일
 * @property {string} max_applicants - 모집인원 (문자열)
 * @property {string} work_location - 근무지
 */

/**
 * 제안서 생성/수정 폼 데이터
 * @typedef {Object} ProposalFormData
 * @property {string} message - 제안 메시지
 * @property {string} proposed_budget - 제안 예산 (문자열)
 * @property {string} proposed_timeline - 예상 작업 기간
 */

/**
 * API 응답 타입 (무한스크롤)
 * @typedef {Object} InfiniteScrollResponse
 * @property {ExpertRequest[]} data - 요청 목록
 * @property {boolean} hasMore - 추가 데이터 존재 여부
 * @property {number|null} nextCursor - 다음 페이지 커서
 */

/**
 * 상태 표시 정보
 * @typedef {Object} StatusDisplay
 * @property {string} text - 표시 텍스트
 * @property {string} bgColor - 배경색 클래스
 * @property {string} textColor - 텍스트 색상 클래스
 */

/**
 * 유효성 검사 결과
 * @typedef {string[]} ValidationErrors
 */

/**
 * API 함수 타입
 * @typedef {Object} ExpertRequestsAPI
 * @property {() => Promise<ExpertRequest[]>} select
 * @property {(id: number) => Promise<ExpertRequest>} select_by_id
 * @property {(category: RequestCategory) => Promise<ExpertRequest[]>} select_by_category
 * @property {(search_text: string) => Promise<ExpertRequest[]>} select_by_search
 * @property {(last_request_id: string, category?: string, limit?: number) => Promise<InfiniteScrollResponse>} select_infinite_scroll
 * @property {(requester_id: string) => Promise<ExpertRequest[]>} select_by_requester_id
 * @property {(request_data: Partial<ExpertRequest>, user_id: string) => Promise<{id: number}>} insert
 * @property {(request_id: number, request_data: Partial<ExpertRequest>, user_id: string) => Promise<ExpertRequest>} update
 * @property {(request_id: number, user_id: string) => Promise<void>} delete
 * @property {(request_id: number) => Promise<void>} complete_project
 */

/**
 * 제안서 API 함수 타입
 * @typedef {Object} ExpertRequestProposalsAPI
 * @property {(request_id: number) => Promise<ExpertRequestProposal[]>} select_by_request_id
 * @property {(expert_id: string) => Promise<ExpertRequestProposal[]>} select_by_expert_id
 * @property {(id: number) => Promise<ExpertRequestProposal>} select_by_id
 * @property {(proposal_data: Partial<ExpertRequestProposal>, user_id: string) => Promise<{id: number}>} insert
 * @property {(proposal_id: number, proposal_data: Partial<ExpertRequestProposal>) => Promise<ExpertRequestProposal>} update
 * @property {(proposal_id: number, status: ProposalStatus) => Promise<ExpertRequestProposal>} update_status
 * @property {(proposal_id: number) => Promise<void>} delete
 * @property {(proposal_id: number, request_id: number) => Promise<void>} accept_proposal
 * @property {(proposal_id: number) => Promise<ExpertRequestProposal>} reject_proposal
 */

// Export for use in other modules
export {};

// 타입 가드 함수들
/**
 * 요청 상태가 유효한지 검사
 * @param {string} status 
 * @returns {status is RequestStatus}
 */
export function isValidRequestStatus(status) {
	return ['open', 'in_progress', 'completed', 'cancelled'].includes(status);
}

/**
 * 제안 상태가 유효한지 검사
 * @param {string} status 
 * @returns {status is ProposalStatus}
 */
export function isValidProposalStatus(status) {
	return ['pending', 'accepted', 'rejected'].includes(status);
}

/**
 * 카테고리가 유효한지 검사
 * @param {string} category 
 * @returns {category is RequestCategory}
 */
export function isValidCategory(category) {
	return [
		'웹개발/프로그래밍',
		'모바일 앱 개발',
		'디자인',
		'마케팅/광고',
		'글쓰기/콘텐츠',
		'번역/통역',
		'영상/사진',
		'음악/사운드',
		'비즈니스 컨설팅',
		'기타'
	].includes(category);
}

/**
 * 날짜 문자열이 유효한 ISO 포맷인지 검사
 * @param {string} dateString 
 * @returns {boolean}
 */
export function isValidISODate(dateString) {
	const date = new Date(dateString);
	return date instanceof Date && !isNaN(date.getTime()) && dateString === date.toISOString();
}

/**
 * 보상금이 유효한 범위인지 검사
 * @param {number} reward_amount 
 * @returns {boolean}
 */
export function isValidRewardAmount(reward_amount) {
	return typeof reward_amount === 'number' && reward_amount >= 10000 && reward_amount <= 100000000;
}

/**
 * 모집인원이 유효한 범위인지 검사
 * @param {number} max_applicants 
 * @returns {boolean}
 */
export function isValidMaxApplicants(max_applicants) {
	return typeof max_applicants === 'number' && max_applicants >= 1 && max_applicants <= 100;
}

/**
 * 근무지가 유효한지 검사
 * @param {string} work_location 
 * @returns {boolean}
 */
export function isValidWorkLocation(work_location) {
	return typeof work_location === 'string' && work_location.trim().length >= 2 && work_location.trim().length <= 100;
}

/**
 * 요청 객체가 유효한 ExpertRequest 타입인지 검사
 * @param {any} obj 
 * @returns {obj is ExpertRequest}
 */
export function isExpertRequest(obj) {
	return obj &&
		typeof obj.id === 'number' &&
		typeof obj.title === 'string' &&
		typeof obj.description === 'string' &&
		isValidCategory(obj.category) &&
		isValidRequestStatus(obj.status) &&
		typeof obj.requester_id === 'string' &&
		typeof obj.created_at === 'string' &&
		typeof obj.updated_at === 'string';
}

/**
 * 제안서 객체가 유효한 ExpertRequestProposal 타입인지 검사
 * @param {any} obj 
 * @returns {obj is ExpertRequestProposal}
 */
export function isExpertRequestProposal(obj) {
	return obj &&
		typeof obj.id === 'number' &&
		typeof obj.request_id === 'number' &&
		typeof obj.expert_id === 'string' &&
		typeof obj.message === 'string' &&
		isValidProposalStatus(obj.status) &&
		typeof obj.created_at === 'string' &&
		typeof obj.updated_at === 'string';
}