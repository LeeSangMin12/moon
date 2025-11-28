/**
 * App-wide Context Management
 *
 * Svelte 5 Context API를 사용한 전역 상태 관리
 * - User Context: 현재 사용자 정보 (반응형)
 * - API Context: Supabase API 인스턴스
 */

import profile_png from '$lib/img/common/user/profile.png';
import { getContext, setContext } from 'svelte';

// Context Keys
const USER_KEY = Symbol('user');
const API_KEY = Symbol('api');

// 기본 사용자 객체
const DEFAULT_USER = {
	id: null,
	phone: '010-0000-0000',
	email: 'example@example.com',
	handle: '비회원',
	name: '비회원',
	avatar_url: profile_png,
	banner_url: '',
	gender: '남',
	birth_date: '2000-01-01',
	self_introduction: '비회원입니다.',
	moon_cash: 0,
	rating: 0,
	website_url: '',
	user_follows: [],
	user_followers: [],
};

// ============================================================================
// User Context
// ============================================================================

/**
 * 사용자 컨텍스트 생성 및 설정
 * @param {object} initial_user - 초기 사용자 데이터
 * @returns {object} me - 반응형 사용자 객체
 */
export function create_user_context(initial_user = null) {
	const me = $state(initial_user || { ...DEFAULT_USER });
	setContext(USER_KEY, me);
	return me;
}

/**
 * 사용자 컨텍스트 가져오기
 * @returns {object} me - 반응형 사용자 객체
 */
export function get_user_context() {
	const me = getContext(USER_KEY);
	if (!me) {
		throw new Error(
			'User context not found. Call create_user_context() in parent layout.',
		);
	}
	return me;
}

// ============================================================================
// API Context
// ============================================================================

/**
 * API 컨텍스트 생성 및 설정
 * @param {object} initial_api - Supabase API 객체
 * @returns {object} api - 반응형 API 인스턴스
 */
export function create_api_context(initial_api) {
	const api = $state(initial_api);
	setContext(API_KEY, api);
	return api;
}

/**
 * API 컨텍스트 가져오기
 * @returns {object} api - Supabase API 인스턴스
 */
export function get_api_context() {
	const api = getContext(API_KEY);
	if (!api) {
		throw new Error(
			'API context not found. Call create_api_context() in parent layout.',
		);
	}
	return api;
}
