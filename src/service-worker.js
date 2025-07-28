const CACHE_NAME = 'moon-cache-v1';
const STATIC_CACHE = 'moon-static-v1';

const STATIC_ASSETS = ['/', '/favicon.png', '/logo.png'];

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

	// Handle static assets
	if (
		event.request.destination === 'image' ||
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
					if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE) {
						return caches.delete(cacheName);
					}
				}),
			);
		}),
	);
});
