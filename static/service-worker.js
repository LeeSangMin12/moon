const CACHE_NAME = 'moon-cache-v1';
const STATIC_CACHE = 'moon-static-v1';

// 이미지 캐시를 위한 별도 캐시 이름 (버전 관리)
const IMAGE_CACHE = 'moon-images-v1';

const STATIC_ASSETS = ['/', '/favicon.png', '/logo.png'];

// 이미지 파일 확장자들
const IMAGE_EXTENSIONS = [
	'.jpg',
	'.jpeg',
	'.png',
	'.gif',
	'.webp',
	'.svg',
	'.ico',
];

self.addEventListener('install', (event) => {
	event.waitUntil(
		caches.open(STATIC_CACHE).then((cache) => {
			return cache.addAll(STATIC_ASSETS);
		}),
	);
});

self.addEventListener('fetch', (event) => {
	// Skip non-GET requests
	if (event.request.method !== 'GET') return;

	const url = new URL(event.request.url);

	// Only cache HTTP/HTTPS requests (skip chrome-extension://, data:, blob:, etc.)
	if (url.protocol !== 'http:' && url.protocol !== 'https:') {
		return;
	}
	const isImage = IMAGE_EXTENSIONS.some((ext) =>
		url.pathname.toLowerCase().includes(ext),
	);

	// Handle images with network-first strategy for better updates
	if (isImage) {
		event.respondWith(
			fetch(event.request)
				.then((response) => {
					// Cache successful image responses
					if (response.status === 200) {
						const responseClone = response.clone();
						caches.open(IMAGE_CACHE).then((cache) => {
							cache.put(event.request, responseClone);
						});
					}
					return response;
				})
				.catch(() => {
					// Fallback to cache if network fails
					return caches.match(event.request);
				}),
		);
		return;
	}

	// Handle other static assets (fonts, styles)
	if (
		event.request.destination === 'font' ||
		event.request.destination === 'style'
	) {
		event.respondWith(
			caches.match(event.request).then((response) => {
				return (
					response ||
					fetch(event.request).then((response) => {
						// Cache the response for future use
						if (response.status === 200) {
							const responseClone = response.clone();
							caches.open(STATIC_CACHE).then((cache) => {
								cache.put(event.request, responseClone);
							});
						}
						return response;
					})
				);
			}),
		);
		return;
	}

	// For API requests, try network first, then cache
	if (event.request.url.includes('/api/')) {
		event.respondWith(
			fetch(event.request)
				.then((response) => {
					// Cache successful responses
					if (response.status === 200) {
						const responseClone = response.clone();
						caches.open(CACHE_NAME).then((cache) => {
							cache.put(event.request, responseClone);
						});
					}
					return response;
				})
				.catch(() => {
					// Fallback to cache if network fails
					return caches.match(event.request);
				}),
		);
		return;
	}

	// For other requests, use network first strategy
	event.respondWith(
		fetch(event.request).catch(() => {
			return caches.match(event.request);
		}),
	);
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches.keys().then((cacheNames) => {
			return Promise.all(
				cacheNames.map((cacheName) => {
					if (
						cacheName !== CACHE_NAME &&
						cacheName !== STATIC_CACHE &&
						cacheName !== IMAGE_CACHE
					) {
						return caches.delete(cacheName);
					}
				}),
			);
		}),
	);
});

// 이미지 캐시를 강제로 갱신하는 메시지 핸들러
self.addEventListener('message', (event) => {
	if (event.data && event.data.type === 'SKIP_WAITING') {
		self.skipWaiting();
	}

	if (event.data && event.data.type === 'CLEAR_IMAGE_CACHE') {
		caches.delete(IMAGE_CACHE);
	}
});
