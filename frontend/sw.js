/* ── StayFinder Service Worker ─────────────────────────────────── */
const CACHE_NAME = 'stayfinder-v3';
const API_CACHE_NAME = 'stayfinder-api-v3';

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
      Promise.all(
        keys.filter(k => k !== CACHE_NAME && k !== API_CACHE_NAME)
           .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch — network first for API, cache first for static
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // API calls — network first with cache fallback for GET requests
  if (url.pathname.startsWith('/api/') || url.hostname.includes('onrender.com')) {
    // Only cache GET requests (not POST, PUT, DELETE)
    if (e.request.method === 'GET') {
      e.respondWith(
        fetch(e.request)
          .then(response => {
            // Cache successful responses
            if (response.status === 200) {
              const clone = response.clone();
              caches.open(API_CACHE_NAME).then(cache => cache.put(e.request, clone));
            }
            return response;
          })
          .catch(() => {
            // Offline — try to serve from cache
            return caches.match(e.request).then(cached => {
              if (cached) {
                console.log('[SW] Serving cached API response:', url.pathname);
                return cached;
              }
              // No cache available
              return new Response(
                JSON.stringify({ error: 'Offline and no cached data available' }),
                { status: 503, headers: { 'Content-Type': 'application/json' } }
              );
            });
          })
      );
    } else {
      // Non-GET requests (POST, PUT, DELETE) — network only
      e.respondWith(
        fetch(e.request).catch(() => 
          new Response(
            JSON.stringify({ error: 'Cannot perform this action offline' }),
            { status: 503, headers: { 'Content-Type': 'application/json' } }
          )
        )
      );
    }
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
