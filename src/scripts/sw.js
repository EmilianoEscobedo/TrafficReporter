const CACHE_NAME = 'siniestros-viales-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/styles/styles.css',
    '/scripts/config.js',
    '/scripts/geocoding.js',
    '/scripts/maps.js',
    '/scripts/pwa.js',
    '/scripts/app.js',
    '/manifest.json',
    '/assets/logo.png',
    '/assets/icon-192x192.png',
    '/assets/icon-512x512.png',
    'https://cdn.tailwindcss.com',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});