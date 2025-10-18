// 전문가 요청 시스템 공통 유틸리티 함수들

import { comma } from '$lib/utils/common';

// 요청 상태 상수
export const REQUEST_STATUS = {
	DRAFT: 'draft',
	PENDING_PAYMENT: 'pending_payment',
	OPEN: 'open',
	IN_PROGRESS: 'in_progress',
	COMPLETED: 'completed',
	CANCELLED: 'cancelled'
};

// 제안 상태 상수
export const PROPOSAL_STATUS = {
	PENDING: 'pending',
	ACCEPTED: 'accepted',
	REJECTED: 'rejected'
};

// 요청 상태 표시 정보 반환
export const getRequestStatusDisplay = (status) => {
	const statusMap = {
		[REQUEST_STATUS.DRAFT]: {
			text: '결제 대기',
			bgColor: 'bg-amber-50',
			textColor: 'text-amber-600'
		},
		[REQUEST_STATUS.PENDING_PAYMENT]: {
			text: '승인 대기',
			bgColor: 'bg-blue-50',
			textColor: 'text-blue-600'
		},
		[REQUEST_STATUS.OPEN]: {
			text: '모집중',
			bgColor: 'bg-emerald-50',
			textColor: 'text-emerald-600'
		},
		[REQUEST_STATUS.IN_PROGRESS]: {
			text: '진행중',
			bgColor: 'bg-amber-50',
			textColor: 'text-amber-600'
		},
		[REQUEST_STATUS.COMPLETED]: {
			text: '완료',
			bgColor: 'bg-gray-50',
			textColor: 'text-gray-500'
		},
		[REQUEST_STATUS.CANCELLED]: {
			text: '취소됨',
			bgColor: 'bg-red-50',
			textColor: 'text-red-600'
		}
	};
	return statusMap[status] || {
		text: '알 수 없음',
		bgColor: 'bg-gray-50',
		textColor: 'text-gray-500'
	};
};

// 제안 상태 표시 정보 반환
export const getProposalStatusDisplay = (status) => {
	const statusMap = {
		[PROPOSAL_STATUS.PENDING]: { 
			text: '검토중', 
			bgColor: 'bg-gray-50', 
			textColor: 'text-gray-600' 
		},
		[PROPOSAL_STATUS.ACCEPTED]: { 
			text: '승인됨', 
			bgColor: 'bg-emerald-50', 
			textColor: 'text-emerald-600' 
		},
		[PROPOSAL_STATUS.REJECTED]: { 
			text: '거절됨', 
			bgColor: 'bg-red-50', 
			textColor: 'text-red-600' 
		}
	};
	return statusMap[status] || { 
		text: '알 수 없음', 
		bgColor: 'bg-gray-50', 
		textColor: 'text-gray-500' 
	};
};

// 보상금 포맷팅
export const formatRewardAmount = (reward_amount, price_unit = 'per_project') => {
	if (!reward_amount) return '협의';

	const unit_map = {
		per_project: '건당',
		per_hour: '시간당',
		per_page: '장당',
		per_day: '일당',
		per_month: '월',
		per_year: '년',
	};

	const unit_label = unit_map[price_unit] || '건당';
	return `${unit_label} ${comma(reward_amount)}원`;
};

// 모집인원 포맷팅
export const formatMaxApplicants = (max_applicants) => {
	if (!max_applicants) return '미정';
	return `${max_applicants}명`;
};

// 근무지 포맷팅
export const formatWorkLocation = (work_location) => {
	if (!work_location) return '미정';
	return work_location;
};

// 비호환성을 위한 기존 formatBudget 함수 유지 (다른 컴포넌트에서 사용 중일 수 있음)
export const formatBudget = (min_budget, max_budget) => {
	if (!min_budget && !max_budget) return '협의';
	if (!min_budget) return `~${comma(max_budget)}원`;
	if (!max_budget) return `${comma(min_budget)}원~`;
	return `${comma(min_budget)}-${comma(max_budget)}원`;
};

// 모집 마감일 포맷팅 (상대적 시간)
export const formatApplicationDeadlineRelative = (application_deadline) => {
	if (!application_deadline) return '상시 모집';
	const date = new Date(application_deadline);
	const now = new Date();
	const diffTime = date.getTime() - now.getTime();
	const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

	if (diffDays < 0) return '모집 마감';
	if (diffDays === 0) return '오늘 마감';
	if (diffDays <= 7) return `${diffDays}일 후 마감`;
	if (diffDays <= 30) return `${Math.ceil(diffDays / 7)}주 후 마감`;
	return `${Math.ceil(diffDays / 30)}개월 후 마감`;
};

// 업무 예상 기간 포맷팅
export const formatWorkPeriod = (work_start_date, work_end_date) => {
	if (!work_start_date && !work_end_date) return '협의 후 결정';
	if (!work_start_date) return `~ ${new Date(work_end_date).toLocaleDateString('ko-KR')}`;
	if (!work_end_date) return `${new Date(work_start_date).toLocaleDateString('ko-KR')} ~`;
	return `${new Date(work_start_date).toLocaleDateString('ko-KR')} ~ ${new Date(work_end_date).toLocaleDateString('ko-KR')}`;
};

// 비호환성을 위한 기존 formatDeadlineRelative 함수 유지
export const formatDeadlineRelative = (deadline) => {
	return formatApplicationDeadlineRelative(deadline);
};

// 모집 마감일 포맷팅 (절대적 날짜)
export const formatApplicationDeadlineAbsolute = (application_deadline) => {
	if (!application_deadline) return '상시 모집';
	const date = new Date(application_deadline);
	return date.toLocaleDateString('ko-KR', { 
		year: 'numeric', 
		month: 'long', 
		day: 'numeric' 
	});
};

// 비호환성을 위한 기존 formatDeadlineAbsolute 함수 유지
export const formatDeadlineAbsolute = (deadline) => {
	return formatApplicationDeadlineAbsolute(deadline);
};

// 요청 데이터 유효성 검사
export const validateRequestData = (data) => {
	const errors = [];
	
	// 제목 검사
	if (!data.title?.trim()) {
		errors.push('제목은 필수입니다.');
	} else if (data.title.trim().length < 10) {
		errors.push('제목은 최소 10글자 이상이어야 합니다.');
	} else if (data.title.trim().length > 100) {
		errors.push('제목은 최대 100글자까지 가능합니다.');
	}
	
	// 설명 검사
	if (!data.description?.trim()) {
		errors.push('상세 설명은 필수입니다.');
	} else if (data.description.trim().length < 50) {
		errors.push('상세 설명은 최소 50글자 이상이어야 합니다.');
	} else if (data.description.trim().length > 2000) {
		errors.push('상세 설명은 최대 2000글자까지 가능합니다.');
	}
	
	// 카테고리 검사
	if (!data.category?.trim()) {
		errors.push('카테고리를 선택해주세요.');
	}
	
	// 보상금 검사
	if (!data.reward_amount) {
		errors.push('보상금을 입력해주세요.');
	} else {
		const reward = parseInt(data.reward_amount);
		if (isNaN(reward) || reward < 10000) {
			errors.push('보상금은 10,000원 이상이어야 합니다.');
		}
		if (reward > 100000000) {
			errors.push('보상금은 1억원 이하여야 합니다.');
		}
	}
	
	// 모집인원 검사
	if (!data.max_applicants) {
		errors.push('모집인원을 입력해주세요.');
	} else {
		const applicants = parseInt(data.max_applicants);
		if (isNaN(applicants) || applicants < 1) {
			errors.push('모집인원은 1명 이상이어야 합니다.');
		}
		if (applicants > 100) {
			errors.push('모집인원은 100명 이하여야 합니다.');
		}
	}
	
	// 근무지 검사
	if (!data.work_location?.trim()) {
		errors.push('근무지를 입력해주세요.');
	} else if (data.work_location.trim().length < 2) {
		errors.push('근무지는 최소 2글자 이상이어야 합니다.');
	} else if (data.work_location.trim().length > 100) {
		errors.push('근무지는 최대 100글자까지 가능합니다.');
	}
	
	// 모집 마감일 검사
	if (data.application_deadline) {
		const deadlineDate = new Date(data.application_deadline);
		const now = new Date();
		const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
		
		if (deadlineDate < today) {
			errors.push('모집 마감일은 오늘 이후여야 합니다.');
		}
	}
	
	// 업무 일정 검사
	if (data.work_start_date && data.work_end_date) {
		const startDate = new Date(data.work_start_date);
		const endDate = new Date(data.work_end_date);
		
		if (endDate < startDate) {
			errors.push('업무 종료일은 시작일 이후여야 합니다.');
		}
	}
	
	return errors;
};

// 제안서 데이터 유효성 검사
export const validateProposalData = (data) => {
	const errors = [];
	
	// 메시지 검사
	if (!data.message?.trim()) {
		errors.push('제안 메시지는 필수입니다.');
	} else if (data.message.trim().length < 50) {
		errors.push('제안 메시지는 최소 50글자 이상이어야 합니다.');
	} else if (data.message.trim().length > 1000) {
		errors.push('제안 메시지는 최대 1000글자까지 가능합니다.');
	}
	
	// 제안 예산 검사
	if (data.proposed_budget) {
		const budget = parseInt(data.proposed_budget);
		if (isNaN(budget) || budget < 10000) {
			errors.push('제안 예산은 최소 10,000원 이상이어야 합니다.');
		}
		if (budget > 100000000) {
			errors.push('제안 예산은 1억원 이하여야 합니다.');
		}
	}
	
	// 작업 기간 검사
	if (data.proposed_timeline && data.proposed_timeline.trim().length > 100) {
		errors.push('예상 작업 기간은 최대 100글자까지 가능합니다.');
	}
	
	// 연락처 검사
	if (!data.contact_info?.trim()) {
		errors.push('연락처는 필수입니다.');
	} else if (data.contact_info.trim().length > 200) {
		errors.push('연락처는 최대 200글자까지 가능합니다.');
	}
	
	return errors;
};

// 카테고리 목록
export const REQUEST_CATEGORIES = [
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
];

// 에러 메시지 표준화
export const ERROR_MESSAGES = {
	UNAUTHORIZED: '권한이 없습니다.',
	NOT_FOUND: '요청한 데이터를 찾을 수 없습니다.',
	VALIDATION_FAILED: '입력한 정보를 확인해주세요.',
	NETWORK_ERROR: '네트워크 연결을 확인해주세요.',
	SERVER_ERROR: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
	REQUEST_NOT_OPEN: '이미 마감된 요청입니다.',
	ALREADY_PROPOSED: '이미 제안을 제출했습니다.',
	INVALID_STATUS: '잘못된 상태 변경입니다.'
};

// 성공 메시지 표준화
export const SUCCESS_MESSAGES = {
	REQUEST_CREATED: '전문가 요청이 성공적으로 등록되었습니다!',
	PROPOSAL_SUBMITTED: '제안서가 성공적으로 제출되었습니다!',
	PROPOSAL_ACCEPTED: '제안이 수락되었습니다!',
	PROPOSAL_REJECTED: '제안이 거절되었습니다.',
	PROJECT_COMPLETED: '프로젝트가 완료되었습니다!',
	DATA_UPDATED: '정보가 성공적으로 업데이트되었습니다.',
	DATA_DELETED: '삭제가 완료되었습니다.'
};