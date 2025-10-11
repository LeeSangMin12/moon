import { get } from 'svelte/store';
import { goto } from '$app/navigation';
import { page } from '$app/stores';

/**
 * 스마트 뒤로가기 함수
 * 현재 페이지 경로에 따라 적절한 뒤로가기 동작을 수행
 * @param {Object} user - 현재 로그인한 사용자 객체 (optional)
 */
export function smartGoBack(user = null) {
	const currentPage = get(page);
	const pathname = currentPage.url.pathname;
	const searchParams = currentPage.url.searchParams;

	// 관리자 페이지들
	if (pathname.startsWith('/admin/')) {
		if (pathname === '/admin' || pathname === '/admin/') {
			goto('/');
		} else if (pathname === '/admin/home') {
			goto('/');
		} else {
			goto('/admin/home');
		}
		return;
	}

	// 계정 관련 페이지들
	if (pathname.includes('/accounts/')) {
		const handle = pathname.match(/@([^/]+)/)?.[1];
		if (handle) {
			goto(`/@${handle}`);
		} else {
			goto('/');
		}
		return;
	}

	// 전문가 관련 페이지들
	if (pathname.startsWith('/expert/')) {
		if (user && user.handle) {
			goto(`/@${user.handle}/accounts`);
		} else {
			goto('/service');
		}
		return;
	}

	// 서비스 관련 페이지들
	if (pathname.startsWith('/service/')) {
		goto('/service');
		return;
	}

	// 전문가 요청 관련
	if (pathname.startsWith('/expert-request/')) {
		goto('/service?tab=1');
		return;
	}

	if (pathname.startsWith('/regi/expert-request')) {
		goto('/service');
		return;
	}

	// 등록 페이지들
	if (pathname.startsWith('/regi/')) {
		if (pathname.startsWith('/regi/service')) {
			goto('/service');
		} else if (pathname.startsWith('/regi/post')) {
			goto('/community');
		} else if (pathname.startsWith('/regi/expert-request')) {
			goto('/service');
		} else {
			goto('/');
		}
		return;
	}

	// 커뮤니티 관련
	if (pathname.startsWith('/community/')) {
		if (pathname === '/community/regi') {
			goto('/community');
		} else if (pathname.match(/^\/community\/[^/]+$/)) {
			// 커뮤니티 게시글 페이지
			goto('/community');
		} else {
			goto('/community');
		}
		return;
	}

	// 채팅 관련
	if (pathname.startsWith('/chat/')) {
		goto('/chat');
		return;
	}

	// 사용자 게시글 페이지
	if (pathname.match(/^\/@[^/]+\/post\/[^/]+$/)) {
		// 브라우저 히스토리를 사용하여 이전 페이지로 (홈, 커뮤니티, 프로필 등)
		if (window.history.length > 1) {
			window.history.back();
		} else {
			// 히스토리가 없으면 홈으로
			goto('/');
		}
		return;
	}

	// 사용자 프로필 페이지
	if (pathname.match(/^\/@[^/]+$/)) {
		// 사용자 프로필 페이지 -> 홈으로
		goto('/');
		return;
	}

	// 검색 페이지
	if (pathname === '/search') {
		goto('/');
		return;
	}

	// 알림 페이지
	if (pathname === '/alarm') {
		goto('/');
		return;
	}

	// 로그인 페이지 등은 브라우저 히스토리 사용
	if (pathname === '/login' || pathname === '/sign-up') {
		if (window.history.length > 1) {
			window.history.back();
		} else {
			goto('/');
		}
		return;
	}

	// 기본적으로 브라우저 히스토리 사용, 히스토리가 없으면 홈으로
	if (window.history.length > 1) {
		window.history.back();
	} else {
		goto('/');
	}
}
