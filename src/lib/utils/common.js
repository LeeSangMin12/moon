import { toast } from '@zerodevx/svelte-toast';
import { get } from 'svelte/store';

import Toast from '$lib/components/ui/Toast.svelte';

import { update_global_store } from '$lib/store/global_store';

/**
 * 숫자 1000단위 마다 컴마 추가
 * @param {number} num - 컴마를 추가할 숫자
 * @return {string} 컴마가 추가된 문자열
 */
export const comma = (num) => {
	return num.toString().replace(/(\d)(?=(?:\d{3})+(?!\d))/g, '$1,');
};

/**
 * 컴마 제거
 * @param {number} num - 컴마를 제거할 숫자
 * @return {string} 컴마가 제거된 문자열
 */
export const uncomma = (num) => {
	return num.toString().replace(/[^\d]+/g, '');
};

/**
 *  날짜 형시 포맷
 * @param {Date|string} get_date
 * @return {string} 'YY. MM. DD'
 */
export const format_date = (get_date) => {
	const date = new Date(get_date);

	return `${date?.getFullYear() - 2000}. ${('0' + (date.getMonth() + 1)).slice(-2)}. ${('0' + date.getDate()).slice(-2)}`;
};

/**
 * toast popup 출력
 * @param {text} type - (success, warning)
 * @param {text} message
 */
export const show_toast = (type, message) => {
	toast.push({
		component: {
			src: Toast,
			props: { type: type, message: message },
		},
	});
};

/**
 * 2개의 객체의 obj1의 key값이 일치하는 obj2 키값만 복사
 * @param {*} obj1
 * @param {*} obj2
 * @returns
 */
export const copy_values_when_key_exists = (obj1, obj2) => {
	let result = {};

	for (let key in obj1) {
		if (Object.prototype.hasOwnProperty.call(obj2, key)) {
			result[key] = obj2[key];
		}
	}
	return result;
};

/**
 * 문장 클립보드 카피
 * @param {string} text_to_copy - copy할 문장
 * @param {string} success_message - 복사 성공 시 보여줄 메시지
 */
export const copy_to_clipboard = (text_to_copy, success_message) => {
	if (navigator.clipboard && navigator.clipboard.writeText) {
		// Modern browsers
		navigator.clipboard
			.writeText(text_to_copy)
			.then(() => {
				show_toast('success', success_message);
			})
			.catch((err) => {
				console.error('클립보드 복사 실패:', err);
				fall_back_copy_text_to_clipboard(text_to_copy);
			});
	} else {
		// Fallback for older browsers
		fall_back_copy_text_to_clipboard(text_to_copy, success_message);
	}
};

const fall_back_copy_text_to_clipboard = (text_to_copy, success_message) => {
	const textArea = document.createElement('textarea');
	textArea.value = text_to_copy;

	// Avoid scrolling to bottom
	textArea.style.top = '0';
	textArea.style.left = '0';
	textArea.style.position = 'fixed';

	document.body.appendChild(textArea);
	textArea.focus();
	textArea.select();

	try {
		const successful = document.execCommand('copy');
		const msg = successful ? '성공' : '실패';
		console.log('Fallback: 클립보드 복사 ' + msg);
		show_toast('success', success_message);
	} catch (err) {
		console.error('Fallback: 클립보드 복사 실패', err);
	}

	document.body.removeChild(textArea);
};

/**
 * 오늘 날짜로부터 d-day 구하기
 * @param {date} end_date : 끝나는 날짜
 */
export const calculate_d_day = (end_date) => {
	const today = new Date();
	const comparison_date = new Date(end_date);

	today.setHours(0, 0, 0, 0); //시간 차이 제거
	comparison_date.setHours(0, 0, 0, 0); ////시간 차이 제거

	// 두 날짜의 차이(밀리초 단위)를 구함
	let difference_millie_seconds = comparison_date - today;

	// 밀리초 단위의 차이를 일(day) 단위로 변환
	let difference_in_days = difference_millie_seconds / (1000 * 60 * 60 * 24);

	if (difference_in_days < 0) {
		return '마감';
	}

	return difference_in_days;
};

/**
 * 생년월일 기준 나이 계산 (해당 연도 기준)
 * @param {string} birth_date - 생년월일 (YYYY-MM-DD 형식의 문자열 또는 Date 객체)
 * @returns {number|null} 나이 또는 유효하지 않은 날짜인 경우 null
 */
export const calculate_age = (birth_date) => {
	if (!birth_date) {
		return null;
	}

	const parsed_birth_date = new Date(birth_date);
	if (isNaN(parsed_birth_date.getTime())) {
		return null;
	}

	const current_year = new Date().getFullYear();
	const birth_year = parsed_birth_date.getFullYear();

	return current_year - birth_year;
};

/**
 * Google Tag Manager에 데이터를 전송
 * @param {string} event_name - GTM에서 이벤트를 구분하는 이름
 * @param {Object} data - 이벤트에 전송할 데이터
 */
export const send_data_to_gtm = (event_name, data) => {
	window.dataLayer = window.dataLayer || [];
	window.dataLayer.push({
		event: event_name,
		...data,
	});
};

/**
 * 에러 처리 함수
 * @param {function} fn - 에러 핸들링할 함수
 * @returns {function}
 */
export const error_handling = (fn) => {
	return async (...args) => {
		try {
			return await fn(...args);
		} catch (error) {
			console.error(`Error: ${error.message}`);
			alert(`Error ${error.message}`);
			throw error;
		}
	};
};

export const set_cookie_with_expiration = (name, value, days = null) => {
	let expires = '';

	// JSON 객체일 경우 문자열로 변환
	if (typeof value === 'object') {
		value = JSON.stringify(value);
	}

	// 만료일 설정 (days가 null이 아니면 설정)
	if (days !== null) {
		const date = new Date();
		date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000); // 밀리초 단위 계산
		expires = '; expires=' + date.toUTCString(); // UTC 형식으로 변환
	}

	document.cookie = `${name}=${encodeURIComponent(value)}${expires}; path=/`;
};

export const get_cookie_by_name = (name) => {
	const cookies = document.cookie.split(';');

	for (let cookie of cookies) {
		cookie = cookie.trim();
		if (cookie.startsWith(name + '=')) {
			const value = decodeURIComponent(cookie.substring(name.length + 1)); // URL 디코딩

			// JSON 형식인지 확인하고 파싱 시도
			try {
				return JSON.parse(value);
			} catch (e) {
				// JSON 형식이 아니라면 그대로 반환
				return value;
			}
		}
	}
	return null;
};

export const update_cookie = (name, value, days = null) => {
	// 기존 쿠키가 존재하는지 확인
	const existingCookie = document.cookie
		.split(';')
		.some((cookie) => cookie.trim().startsWith(name + '='));

	if (!existingCookie) {
		console.warn(
			`Cookie with name "${name}" does not exist. It will be created.`,
		);
	}

	// 기존 쿠키가 없어도 새로 생성하거나 덮어쓰기
	set_cookie_with_expiration(name, value, days);
};

export const delete_cookie = (name) => {
	document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/`;
};

export const get_time_past = (date) => {
	const now = new Date();
	const seconds = Math.floor((now - date) / 1000);

	let interval = seconds / 31536000;
	if (interval > 1) {
		return Math.floor(interval) + '년 전';
	}
	interval = seconds / 2592000;
	if (interval > 1) {
		return Math.floor(interval) + '달 전';
	}
	interval = seconds / 86400;
	if (interval > 1) {
		return Math.floor(interval) + '일 전';
	}
	interval = seconds / 3600;
	if (interval > 1) {
		return Math.floor(interval) + '시간 전';
	}
	interval = seconds / 60;
	if (interval > 1) {
		return Math.floor(interval) + '분 전';
	}
	return '방금 전';
};

export const has_invalid_args = (args) => {
	return args.some((v) => !v || typeof v !== 'string' || v.trim() === '');
};

export const check_login = (user) => {
	if (!user || user.handle === '비회원') {
		update_global_store('is_login_prompt_modal', true);
		return false;
	}
	return true;
};
