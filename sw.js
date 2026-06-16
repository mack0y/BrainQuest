// ═══════════════════════════════════════════
// BrainQuest – Service Worker
// ═══════════════════════════════════════════

const CACHE_NAME = 'brainquest-v1';

const PRECACHE_URLS = [
  '.',
  'index.html',
  'css/style.css',
  'js/app.js',
  'js/db.js',
  'js/auth.js',
  'js/gamification.js',
  'js/ui.js',
  'manifest.json'
];

// Install – precache static assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(PRECACHE_URLS);
    }).then(() => self.skipWaiting())
  );
});

// Activate – clean old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch – network first, fallback to cache
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        const clone = response.clone();
        if (response.ok) {
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
