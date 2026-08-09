// Oltinde service worker — installable + offline browsing of recently-viewed
// public pages. Hand-written (no Workbox/next-pwa/serwist) so the caching
// rules stay simple and auditable: nothing beyond what's needed for
// "browse pages you've already visited with no signal."
//
// Bump CACHE_VERSION on any change to the caching rules below so stale
// caches from a previous version get cleaned up on activate.
const CACHE_VERSION = 'v1';
const APP_SHELL_CACHE = `oltinde-shell-${CACHE_VERSION}`;
const RUNTIME_CACHE = `oltinde-runtime-${CACHE_VERSION}`;
const STATIC_CACHE = `oltinde-static-${CACHE_VERSION}`;
const ALL_CACHES = [APP_SHELL_CACHE, RUNTIME_CACHE, STATIC_CACHE];

const OFFLINE_URL = '/offline';
const APP_SHELL_URLS = [
  '/',
  OFFLINE_URL,
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// Auth-gated routes are checked client-side only (no server-side cookie
// check on these pages), so a cached shell could flash stale/wrong UI
// before the client redirect fires. Never cache these — always network.
const NEVER_CACHE_PREFIXES = [
  '/admin',
  '/dashboard',
  '/signin',
  '/signup',
  '/reset-password',
  '/profile',
  '/notifications',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(APP_SHELL_CACHE).then((cache) => cache.addAll(APP_SHELL_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => !ALL_CACHES.includes(key))
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

function isNeverCachePath(pathname) {
  return NEVER_CACHE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isStaticAsset(pathname) {
  return pathname.startsWith('/_next/static/') || pathname.startsWith('/icons/');
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const networkPromise = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => undefined);

  if (cached) {
    // Update the cache in the background; don't make the caller wait for it.
    networkPromise.catch(() => {});
    return cached;
  }

  const networkResponse = await networkPromise;
  if (networkResponse) return networkResponse;

  if (request.mode === 'navigate') {
    const offline = await caches.match(OFFLINE_URL);
    if (offline) return offline;
  }
  return Response.error();
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only ever intercept our own GET requests. All Server Actions are POST —
  // never touch those, or a mutation could be swallowed or double-fired.
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (isNeverCachePath(url.pathname)) return; // let it hit the network untouched

  if (isStaticAsset(url.pathname)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
    return;
  }

  event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
});
