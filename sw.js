/**
 * Service Worker for Транспорт Русе PWA
 */

const CACHE_NAME = 'transport-ruse-v1';
const STATIC_ASSETS = [
    './',
    './index.html',
    './css/style.css',
    './js/data-normalized.js',
    './js/app.js',
    './manifest.json'
];

const EXTERNAL_ASSETS = [
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

// Install - cache static assets
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

// Activate - clean old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => {
                return Promise.all(
                    keys.filter(key => key !== CACHE_NAME)
                        .map(key => caches.delete(key))
                );
            })
            .then(() => self.clients.claim())
    );
});

// Fetch - network first, fallback to cache
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== 'GET') return;

    // For map tiles - cache with network fallback
    if (url.hostname.includes('tile.openstreetmap.org')) {
        event.respondWith(
            caches.open(CACHE_NAME + '-tiles')
                .then(cache => {
                    return cache.match(request)
                        .then(cached => {
                            const fetchPromise = fetch(request)
                                .then(response => {
                                    if (response.ok) {
                                        cache.put(request, response.clone());
                                    }
                                    return response;
                                })
                                .catch(() => cached);
                            return cached || fetchPromise;
                        });
                })
        );
        return;
    }

    // For static assets - cache first
    if (STATIC_ASSETS.some(asset => request.url.includes(asset)) ||
        EXTERNAL_ASSETS.some(asset => request.url.includes(asset))) {
        event.respondWith(
            caches.match(request)
                .then(cached => {
                    if (cached) return cached;
                    return fetch(request)
                        .then(response => {
                            if (response.ok) {
                                const clone = response.clone();
                                caches.open(CACHE_NAME)
                                    .then(cache => cache.put(request, clone));
                            }
                            return response;
                        });
                })
        );
        return;
    }

    // For everything else - network first
    event.respondWith(
        fetch(request)
            .catch(() => caches.match(request))
    );
});
