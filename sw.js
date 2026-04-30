// CP Scout Service Worker
// Caches all app pages and CDN assets for offline field use

const CACHE_NAME = 'cp-scout-v3';

// All local pages to cache on install
const STATIC_ASSETS = [
  '/index.html',
  '/map.html',
  '/overview.html',
  '/field-entry.html',
  '/trends.html',
  '/tools.html',
  '/library.html',
  '/current-map.html',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// CDN assets — cached on first use (network-first, then cache)
const CDN_ASSETS = [
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'
];

// ── INSTALL: cache all static assets ──────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log('[CP Scout SW] Caching static assets');
      // Cache local files — fail silently on missing placeholders
      return Promise.allSettled(
        STATIC_ASSETS.map(url =>
          cache.add(url).catch(e => console.warn('[SW] Could not cache:', url, e))
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// ── ACTIVATE: clean up old caches ─────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => {
            console.log('[CP Scout SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      )
    ).then(() => self.clients.claim())
  );
});

// ── FETCH: serve from cache when offline ──────────────────────────────────
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // For CDN requests: try network first, fall back to cache
  const isCDN = CDN_ASSETS.some(cdn => event.request.url.startsWith(cdn.split('/').slice(0,3).join('/')));
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

  // For local app pages: network first, fall back to cache when offline
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then(cached => {
          if (cached) return cached;
          if (event.request.mode === 'navigate') return caches.match('/index.html');
        });
      })
  );
});
