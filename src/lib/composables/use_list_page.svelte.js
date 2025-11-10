/**
 * 범용 리스트 페이지 로딩 Composable
 *
 * 홈/커뮤니티/서비스/외주 등 모든 리스트 페이지에서 재사용 가능한 패턴
 *
 * @param {Object} config - 설정 객체
 * @param {Function} config.load_items - 아이템 로드 함수 (last_id, limit) => Promise<items>
 * @param {Array} config.initial_items - 초기 아이템 배열
 * @param {number} config.page_size - 페이지당 아이템 개수 (기본값: 10)
 * @param {string} config.scroll_target_id - 무한스크롤 타겟 ID (기본값: 'infinite_scroll')
 *
 * @returns {Object} 리스트 관리 객체
 *
 * @example
 * const list = create_list_page({
 *   load_items: (last_id, limit) => api.services.select_infinite_scroll(last_id, limit),
 *   initial_items: data.services,
 *   page_size: 10
 * });
 */
export function create_list_page(config) {
	const {
		load_items,
		initial_items = [],
		page_size = 10,
		scroll_target_id = 'infinite_scroll',
	} = config;

	// ===== State =====
	let items = $state(initial_items);
	let last_item_id = $state('');
	let is_loading = $state(false);
	let observer = null;

	// ===== Initialization =====
	function initialize() {
		items = initial_items;
		last_item_id = items[items.length - 1]?.id || '';
	}

	// ===== Infinite Scroll =====
	async function load_more() {
		if (is_loading || !last_item_id) return;

		try {
			is_loading = true;
			const new_items = await load_items(last_item_id, page_size);

			if (new_items.length > 0) {
				items = [...items, ...new_items];
				last_item_id = new_items[new_items.length - 1]?.id || '';
			} else {
				// 더 이상 아이템이 없음
				last_item_id = '';
			}
		} catch (error) {
			console.error('Failed to load more items:', error);
		} finally {
			is_loading = false;
		}
	}

	function setup_infinite_scroll() {
		if (observer) {
			observer.disconnect();
		}

		const target = document.getElementById(scroll_target_id);
		if (!target) {
			console.warn(`Infinite scroll target #${scroll_target_id} not found`);
			return () => {};
		}

		observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (
						entry.isIntersecting &&
						!is_loading &&
						items.length >= page_size
					) {
						load_more();
					}
				});
			},
			{
				rootMargin: '200px 0px',
				threshold: 0.01,
			}
		);

		observer.observe(target);

		return () => {
			if (observer) {
				observer.disconnect();
				observer = null;
			}
		};
	}

	// ===== Refresh =====
	async function refresh() {
		try {
			is_loading = true;
			const new_items = await load_items('', page_size);
			items = new_items;
			last_item_id = new_items[new_items.length - 1]?.id || '';
		} catch (error) {
			console.error('Failed to refresh items:', error);
		} finally {
			is_loading = false;
		}
	}

	// ===== Public API =====
	return {
		get items() {
			return items;
		},
		set items(value) {
			items = value;
		},
		get is_loading() {
			return is_loading;
		},
		initialize,
		setup_infinite_scroll,
		load_more,
		refresh,
	};
}
