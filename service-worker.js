// service-worker.js

const CACHE_NAME = 'dabarha-pwa-cache-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/style.css',
    '/app.js',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', event => {
    // تجاهل طلبات الـ API تمامًا من التخزين المؤقت
    if (event.request.url.includes('/api/')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // إذا وجدنا الملف في الكاش، نرجعه
                if (response) {
                    return response;
                }
                // وإلا، نجلبه من الشبكة
                return fetch(event.request);
            })
    );
});