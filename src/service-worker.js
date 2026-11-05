import { build, files, version } from '$service-worker';

const CACHE = `promptflam-${version}`;
const ASSETS = [...build, ...files];

// Install: pre-cache build assets, then activate immediately
// (don't wait for old tabs to close before taking over)
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

// Activate: delete old versioned caches, take control of open clients immediately
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);

  // Never cache API calls or large media
  if (url.pathname.startsWith('/api') ||
      /\.(mp4|mp3|wav|webm|blob)$/.test(url.pathname)) return;

  // HTML navigations: network-first so new deploys are picked up immediately.
  // Falls back to cache only if offline.
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, copy));
          return response;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  // Hashed build assets (immutable JS/CSS): cache-first is safe and fast,
  // since filenames change whenever content changes.
  if (ASSETS.includes(url.pathname)) {
    e.respondWith(
      caches.match(e.request).then(r => r ?? fetch(e.request))
    );
    return;
  }

  // Everything else (other static files): network-first, fall back to cache.
  e.respondWith(
    fetch(e.request)
      .then(response => {
        const copy = response.clone();
        caches.open(CACHE).then(cache => cache.put(e.request, copy));
        return response;
      })
      .catch(() => caches.match(e.request))
  );
});
