const CACHE_NAME = 'hotrodvc-cache-v2';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './css/style.css',
    './js/script.js',
    './manifest.json',
    './assets/favicon.ico',
    'https://cdn.jsdelivr.net/npm/driver.js@1.0.1/dist/driver.css',
    'https://cdn.jsdelivr.net/npm/driver.js@1.0.1/dist/driver.js.iife.js',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(ASSETS_TO_CACHE);
            })
    );
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', (event) => {
    // Strategy: Stale-While-Revalidate for JSON data, Cache-First for static assets
    if (event.request.url.includes('data.json')) {
        event.respondWith(
            caches.open(CACHE_NAME).then((cache) => {
                return fetch(event.request)
                    .then((fetchedResponse) => {
                        cache.put(event.request, fetchedResponse.clone());
                        return fetchedResponse;
                    })
                    .catch(() => {
                        return cache.match(event.request);
                    });
            })
        );
    } else {
        event.respondWith(
            caches.match(event.request)
                .then((response) => {
                    if (response) {
                        return response;
                    }
                    return fetch(event.request).then((response) => {
                        // Don't cache cross-origin requests unless necessary, or cache them dynamically
                        // For now, simpler to just return fetch if not in cache
                        return response;
                    });
                })
        );
    }
});