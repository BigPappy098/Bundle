const CACHE_NAME = 'pump-bundler-v1';
const ASSETS = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    'https://cdn.jsdelivr.net/npm/qrcode.js/lib/qrcode.min.js',
    'https://unpkg.com/@solana/web3.js@1.70.1/lib/index.iife.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS))
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then(response => response || fetch(event.request))
    );
});