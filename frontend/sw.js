/* ── StayFinder Service Worker ─────────────────────────────────── */
const CACHE_NAME = 'stayfinder-v2';

// Static assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/global.css',
  '/css/nav.css',
  '/css/search.css',
  '/css/auth.css',
  '/css/property.css',
  '/css/host.css',
  '/js/utils.js',
  '/js/api.js',
  '/js/auth.js',
  '/js/websocket.js',
  '/js/search.js',
  '/js/property.js',
  '/js/host.js',
  '/pages/property.html',
  '/pages/search.html',
  '/pages/trips.html',
  '/pages/wishlist.html',
  '/pages/host.html',
  '/pages/profile.html',
];

// Install — cache static assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate — clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch — network first for API, cache first for static
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Always go network for API calls
  if (url.pathname.startsWith('/api/') || url.hostname.includes('onrender.com')) {
    e.respondWith(fetch(e.request).catch(() => new Response('Offline', { status: 503 })));
    return;
  }

  // Cache first for static assets
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(response => {
        // Cache successful GET responses
        if (e.request.method === 'GET' && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return response;
      }).catch(() => {
        // Offline fallback for HTML pages
        if (e.request.headers.get('accept')?.includes('text/html')) {
          return caches.match('/index.html');
        }
      });
    })
  );
});
