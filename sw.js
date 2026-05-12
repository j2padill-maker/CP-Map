// CP Scout Service Worker v8
const CACHE_NAME = 'cp-scout-v8';

// HTML pages — never pre-cached, always network-first so updates deploy instantly
const HTML_PAGES = [
  '/index.html',
  '/map.html',
  '/overview.html',
  '/field-entry.html',
  '/trends.html',
  '/tools.html',
  '/library.html',
  '/current-map.html',
];

// Static assets that rarely change — cached for offline use
const STATIC_ASSETS = [
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// CDN assets — network first, cached as fallback
const CDN_ORIGINS = [
  'cdnjs.cloudflare.com'
];

// ── INSTALL ────────────────────────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.allSettled(
        STATIC_ASSETS.map(url =>
          cache.add(url).catch(e => console.warn('[SW] Could not cache:', url, e))
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// ── ACTIVATE: wipe all old caches ─────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// ── FETCH ──────────────────────────────────────────────────────────────────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // HTML pages — ALWAYS network first, NO cache fallback for html
  // This ensures deployed updates are always picked up immediately
  const isHTML = HTML_PAGES.includes(url.pathname) ||
                 url.pathname === '/' ||
                 url.pathname.endsWith('.html');
  if (isHTML) {
    event.respondWith(
      fetch(event.request, { cache: 'no-cache' })
        .then(response => {
          // Update cache with fresh version but serve the fresh response
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => {
          // Only use cache as last resort when offline
          return caches.match(event.request).then(cached => {
            if (cached) return cached;
            return caches.match('/index.html');
          });
        })
    );
    return;
  }

  // CDN assets — network first, cache fallback
  const isCDN = CDN_ORIGINS.some(origin => url.hostname.includes(origin));
  if (isCDN) {
    event.respondWith(
      fetch(event.request)
        .then(response => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Everything else — network first, cache fallback
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
