/**
 * Service Worker for Транспорт Русе PWA
 *
 * CACHE_VERSION must be incremented when cached files change.
 * BUILD_DATE should be updated to reflect the latest deployment date.
 */

const CACHE_VERSION = 5;
const BUILD_DATE = '2026-02-26';
const CACHE_NAME = `transport-ruse-v${CACHE_VERSION}`;
const TILES_CACHE_NAME = `${CACHE_NAME}-tiles`;
const STATIC_ASSET_PATHS = [
    'index.html',
    'css/style.css',
    'js/i18n.js',
    'js/data-normalized.js',
    'js/route-planner.js',
    'js/app.js',
    'data/route-geometries.json',
    'manifest.json',
    'vendor/leaflet/leaflet.css',
    'vendor/leaflet/leaflet.js',
    'vendor/leaflet/images/marker-icon.png',
    'vendor/leaflet/images/marker-icon-2x.png',
    'vendor/leaflet/images/marker-shadow.png',
    'vendor/leaflet/images/layers.png',
    'vendor/leaflet/images/layers-2x.png',
    'vendor/leaflet-markercluster/leaflet.markercluster.js',
    'vendor/leaflet-markercluster/MarkerCluster.css',
    'vendor/leaflet-markercluster/MarkerCluster.Default.css'
];

// Build full URLs for caching during install
const STATIC_ASSETS = STATIC_ASSET_PATHS.map(p => `./${p}`);
STATIC_ASSETS.unshift('./');

/**
 * Check if a request URL matches a static asset
 */
function isStaticAsset(requestUrl) {
    const url = new URL(requestUrl);
    const path = url.pathname;
    // Match the scope root (e.g. /OGTR/) or any known asset path
    const scope = self.registration ? self.registration.scope : '';
    const scopePath = scope ? new URL(scope).pathname : '/';
    if (path === scopePath || path === scopePath + 'index.html') return true;
    return STATIC_ASSET_PATHS.some(asset => path.endsWith('/' + asset));
}

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

// Activate - clean old caches (including old tile caches)
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => {
                return Promise.all(
                    keys.filter(key => {
                        // Keep current cache and current tiles cache
                        return key !== CACHE_NAME && key !== TILES_CACHE_NAME;
                    }).map(key => caches.delete(key))
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
            caches.open(TILES_CACHE_NAME)
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

    // For data files - stale-while-revalidate
    if (url.pathname.includes('/data/')) {
        event.respondWith(
            caches.open(CACHE_NAME).then(cache => {
                return cache.match(request).then(cached => {
                    const fetchPromise = fetch(request).then(response => {
                        if (response.ok) {
                            cache.put(request, response.clone());
                        }
                        return response;
                    }).catch(() => cached);
                    return cached || fetchPromise;
                });
            })
        );
        return;
    }

    // For static assets - cache first
    if (isStaticAsset(request.url)) {
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
