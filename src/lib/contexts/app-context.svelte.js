/**
 * App-wide Context Management
 * user_store와 api_store를 Context로 대체
 */

import { getContext, setContext } from 'svelte';
import profile_png from '$lib/img/common/user/profile.png';

// Context Keys
const USER_KEY = Symbol('user');
const API_KEY = Symbol('api');

// ============================================================================
// User Context
// ============================================================================

/**
 * 사용자 컨텍스트 초기화 및 설정
 * @param {object} initialUser - 초기 사용자 데이터
 */
export function create_user_context(initialUser = null) {
	const user = $state(initialUser || {
		id: null,
		phone: '010-0000-0000',
		handle: '비회원',
		name: '비회원',
		avatar_url: profile_png,
		banner_url: '',
		gender: '남',
		birth_date: '2000-01-01',
		self_introduction: '비회원입니다.',
		moon_point: 0,
		rating: 0,
		website_url: '',
		user_follows: [],
		user_followers: [],
	});

	// 사용자 정보 업데이트 함수 (proxy 유지)
	function update(updates) {
		Object.assign(user, updates);
	}

	const context = { me: user, update };
	setContext(USER_KEY, context);
	return context;
}

/**
 * 사용자 컨텍스트 가져오기
 * @returns {object} user context - { me, update }
 */
export function get_user_context() {
	const context = getContext(USER_KEY);
	if (!context) {
		throw new Error('User context not found. Did you call create_user_context in parent layout?');
	}
	return context;
}

// ============================================================================
// API Context
// ============================================================================

/**
 * API 컨텍스트 초기화 및 설정
 * @param {object} api - Supabase API 객체
 */
export function create_api_context(api) {
	const api_instance = $state(api);

	// API 업데이트 함수 (proxy 유지)
	function update(new_api) {
		Object.assign(api_instance, new_api);
	}

	const context = { api: api_instance, update };
	setContext(API_KEY, context);
	return context;
}

/**
 * API 컨텍스트 가져오기
 * @returns {object} api context - { api, update }
 */
export function get_api_context() {
	const context = getContext(API_KEY);
	if (!context) {
		throw new Error('API context not found. Did you call create_api_context in parent layout?');
	}
	return context;
}
