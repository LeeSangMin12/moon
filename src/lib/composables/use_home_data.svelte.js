/**
 * 홈 페이지 데이터 관리 Composable
 *
 * 홈 페이지의 게시물, 커뮤니티, 알림 데이터를 관리합니다.
 * 탭 전환, 무한스크롤, 알림 카운트 갱신 등의 로직을 캡슐화합니다.
 *
 * @param {Object} api - Supabase API 인스턴스
 * @param {Object} me - 현재 로그인한 사용자 객체
 * @param {Array} initial_posts - 초기 게시물 배열 (서버에서 로드된 데이터)
 * @returns {Object} 홈 페이지 데이터 및 메서드
 *
 * @example
 * const home_data = create_home_data(api, me, data.posts);
 *
 * // 무한스크롤 설정
 * $effect(() => {
 *   const cleanup = home_data.setup_infinite_scroll();
 *   return cleanup;
 * });
 */
export function create_home_data(api, me, initial_posts = []) {
	// ===== State =====
	/** @type {Array} 표시할 게시물 목록 */
	let posts = $state(initial_posts);

	/** @type {Array} 사용자가 가입한 커뮤니티 목록 */
	let joined_communities = $state([]);

	/** @type {Array} 탭 목록 (['최신', ...커뮤니티명]) */
	let tabs = $state(['최신']);

	/** @type {number} 현재 선택된 탭 인덱스 */
	let selected = $state(0);

	/** @type {number} 읽지 않은 알림 개수 */
	let unread_count = $state(0);

	/** @type {string} 무한스크롤용 마지막 게시물 ID */
	let last_post_id = $state('');

	/** @type {boolean} 탭 전환 로딩 중 여부 */
	let is_tab_loading = $state(false);

	/** @type {boolean} 무한스크롤 로딩 중 여부 */
	let is_infinite_loading = $state(false);

	/** @type {IntersectionObserver|null} 무한스크롤 옵저버 */
	let observer = null;

	// ===== Initialization =====
	/**
	 * 초기 데이터 설정
	 * posts와 last_post_id를 초기화합니다.
	 * 서버에서 이미 votes/bookmarks가 있으면 그대로 사용합니다.
	 */
	async function initialize_posts() {
		// 서버에서 이미 votes/bookmarks가 있는지 확인
		const has_interactions = initial_posts.length > 0 &&
			initial_posts[0].hasOwnProperty('post_votes') &&
			initial_posts[0].hasOwnProperty('post_bookmarks');

		if (has_interactions) {
			// 이미 서버에서 붙여서 왔으면 그대로 사용
			posts = initial_posts;
		} else {
			// 없으면 클라이언트에서 조회
			posts = await attach_user_interactions(initial_posts);
		}

		last_post_id = posts[posts.length - 1]?.id || '';
	}

	/**
	 * 보조 데이터 로딩 (커뮤니티, 알림)
	 * 초기 렌더링 후 백그라운드에서 로드됩니다.
	 */
	async function load_secondary_data() {
		try {
			if (!me?.id) return;

			// 사용자가 가입한 커뮤니티 로드
			const community_members = await api.community_members.select_by_user_id(me.id);
			joined_communities = community_members.map(cm => cm.communities);
			tabs = ['최신', ...joined_communities.map(c => c.title)];

			// 알림 카운트 로드
			await refresh_unread_count();
		} catch (error) {
			console.error('Failed to load secondary data:', error);
		}
	}

	// ===== Notification =====
	/**
	 * 읽지 않은 알림 개수 갱신
	 */
	async function refresh_unread_count() {
		try {
			if (!me?.id) return;
			unread_count = await api.notifications.select_unread_count(me.id);
		} catch (error) {
			console.error('Failed to load unread notifications count:', error);
		}
	}

	// ===== Posts Loading =====
	/**
	 * 사용자의 투표/북마크 데이터를 게시물에 합치기
	 * @param {Array} post_list - 게시물 배열
	 * @returns {Promise<Array>} votes/bookmarks가 포함된 게시물 배열
	 */
	async function attach_user_interactions(post_list) {
		if (!me?.id || post_list.length === 0) {
			return post_list;
		}

		try {
			const [all_votes, all_bookmarks] = await Promise.all([
				api.post_votes.select_by_user_id(me.id),
				api.post_bookmarks.select_by_user_id_lightweight(me.id),
			]);

			const post_ids = new Set(post_list.map((p) => p.id));
			const votes = all_votes.filter((v) => post_ids.has(v.post_id));
			const bookmarks = all_bookmarks.filter((b) => post_ids.has(b.post_id));

			return post_list.map((post) => ({
				...post,
				post_votes: votes.filter((v) => v.post_id === post.id),
				post_bookmarks: bookmarks.filter((b) => b.post_id === post.id),
			}));
		} catch (error) {
			console.error('Failed to attach user interactions:', error);
			return post_list;
		}
	}

	/**
	 * 선택된 탭에 따라 게시물 로드
	 * @param {number} tab_index - 탭 인덱스 (0: 최신, 1+: 커뮤니티)
	 */
	async function load_posts_by_tab(tab_index) {
		if (!api?.posts || is_tab_loading) return;

		is_tab_loading = true;

		try {
			const community_id =
				tab_index === 0 ? '' : joined_communities[tab_index - 1]?.id ?? '';

			const loaded_posts = await api.posts.select_infinite_scroll(
				'',
				community_id,
				10,
			);

			posts = await attach_user_interactions(loaded_posts);
			last_post_id = loaded_posts.at(-1)?.id ?? '';
		} catch (error) {
			console.error('Failed to load posts:', error);
		} finally {
			is_tab_loading = false;
		}
	}

	// ===== Infinite Scroll =====
	/**
	 * 무한스크롤 더보기 데이터 로드
	 */
	async function load_more_data() {
		if (is_infinite_loading) return;

		try {
			is_infinite_loading = true;

			const community_id =
				selected === 0 ? '' : joined_communities[selected - 1]?.id ?? '';

			const new_posts = await api.posts.select_infinite_scroll(
				last_post_id,
				community_id,
				10,
			);

			if (new_posts.length > 0) {
				const posts_with_interactions = await attach_user_interactions(new_posts);
				posts = [...posts, ...posts_with_interactions];
				last_post_id = new_posts.at(-1)?.id ?? '';
			}
		} catch (error) {
			console.error('Failed to load more posts:', error);
		} finally {
			is_infinite_loading = false;
		}
	}

	/**
	 * 무한스크롤 IntersectionObserver 설정
	 * @returns {Function} cleanup 함수
	 */
	function setup_infinite_scroll() {
		// 기존 observer 정리
		if (observer) {
			observer.disconnect();
		}

		const target = document.getElementById('infinite_scroll');
		if (!target) {
			console.warn('Infinite scroll target not found');
			return () => {};
		}

		observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (
						entry.isIntersecting &&
						!is_infinite_loading &&
						posts.length >= 10
					) {
						load_more_data();
					}
				});
			},
			{
				rootMargin: '200px 0px',
				threshold: 0.01,
			}
		);

		observer.observe(target);

		// cleanup 함수 반환
		return () => {
			if (observer) {
				observer.disconnect();
				observer = null;
			}
		};
	}

	// ===== Post Updates =====
	/**
	 * 게시물 배열 업데이트
	 * 북마크, 좋아요 등 변경 시 사용
	 * @param {Array} updated_posts - 업데이트된 게시물 배열
	 */
	function update_posts(updated_posts) {
		posts = updated_posts;
	}

	// ===== Public API =====
	return {
		// State (Svelte 5 $state는 이미 반응형이므로 직접 노출)
		get posts() { return posts; },
		set posts(value) { posts = value; },
		get joined_communities() { return joined_communities; },
		set joined_communities(value) {
			joined_communities = value;
			tabs = ['최신', ...value.map((c) => c.title)];
		},
		get tabs() { return tabs; },
		set tabs(value) { tabs = value; },
		get selected() { return selected; },
		set selected(value) { selected = value; },
		get unread_count() { return unread_count; },
		set unread_count(value) { unread_count = value; },
		get is_tab_loading() { return is_tab_loading; },
		get is_infinite_loading() { return is_infinite_loading; },

		// Methods
		initialize_posts,
		load_secondary_data,
		refresh_unread_count,
		load_posts_by_tab,
		load_more_data,
		setup_infinite_scroll,
		update_posts,
	};
}
