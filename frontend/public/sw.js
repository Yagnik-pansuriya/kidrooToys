// ============================================================================
// KIDROO TOYS - Service Worker (asset cache)
// Keeps the heavy, rarely-changing files on the device after the first visit:
//   • 3D animal models (/models)  • animal sounds (/sounds)
//   • hashed JS/CSS bundles (/assets)  • product/category/banner images
//   • Google Fonts
// Pages (index.html) are always fetched from the network first so a new
// deploy shows up immediately; the cached copy is only an offline fallback.
// API calls (/api) are never cached here.
//
// Bump CACHE_VERSION when a file in /models or /sounds is replaced under the
// same name — old caches are deleted on activate.
// ============================================================================

const CACHE_VERSION = 'v1';
const STATIC_CACHE = `kidroo-static-${CACHE_VERSION}`; // bundles, models, sounds, fonts
const IMAGE_CACHE = `kidroo-images-${CACHE_VERSION}`;
const PAGE_CACHE = `kidroo-pages-${CACHE_VERSION}`;
const KEEP = [STATIC_CACHE, IMAGE_CACHE, PAGE_CACHE];

const MAX_IMAGES = 200;
const IMAGE_HOSTS = ['res.cloudinary.com', 'images.unsplash.com'];
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names.filter((n) => n.startsWith('kidroo-') && !KEEP.includes(n)).map((n) => caches.delete(n))
      );
      await self.clients.claim();
    })()
  );
});

// Drop the oldest images once the cache grows past MAX_IMAGES
const trimImages = async () => {
  const cache = await caches.open(IMAGE_CACHE);
  const keys = await cache.keys();
  const extra = keys.length - MAX_IMAGES;
  for (let i = 0; i < extra; i++) await cache.delete(keys[i]);
};

const cacheFirst = async (request, cacheName, { cors = false } = {}) => {
  const cache = await caches.open(cacheName);
  const hit = await cache.match(request, { ignoreVary: true });
  if (hit) return hit;

  // <img> asks for cross-origin images in no-cors mode, which gives an opaque
  // response we can't inspect (and that costs a lot of storage quota).
  // Cloudinary/Unsplash allow CORS, so fetch a readable copy to cache instead.
  let response;
  if (cors) {
    try {
      response = await fetch(request.url, { mode: 'cors', credentials: 'omit' });
    } catch {
      return fetch(request);
    }
  } else {
    response = await fetch(request);
  }

  if (response.ok && response.status === 200) {
    cache.put(request, response.clone()).then(() => cacheName === IMAGE_CACHE && trimImages());
  }
  return response;
};

const networkFirstPage = async (request) => {
  const cache = await caches.open(PAGE_CACHE);
  try {
    const response = await fetch(request);
    if (response.ok) cache.put('/', response.clone());
    return response;
  } catch (err) {
    // SPA: every route renders from the same index.html
    const fallback = await cache.match('/');
    if (fallback) return fallback;
    throw err;
  }
};

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  // Media elements stream with Range requests; Safari needs real 206 replies,
  // so leave those to the browser's HTTP cache.
  if (request.headers.has('range')) return;

  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;

  if (sameOrigin) {
    if (url.pathname.startsWith('/api/') || url.pathname === '/sw.js') return;

    if (request.mode === 'navigate') {
      event.respondWith(networkFirstPage(request));
      return;
    }
    if (
      url.pathname.startsWith('/assets/') ||
      url.pathname.startsWith('/models/') ||
      url.pathname.startsWith('/sounds/')
    ) {
      event.respondWith(cacheFirst(request, STATIC_CACHE));
      return;
    }
    if (request.destination === 'image') {
      event.respondWith(cacheFirst(request, IMAGE_CACHE));
    }
    return;
  }

  if (IMAGE_HOSTS.includes(url.hostname) && request.destination === 'image') {
    event.respondWith(cacheFirst(request, IMAGE_CACHE, { cors: true }));
    return;
  }
  if (FONT_HOSTS.includes(url.hostname)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE, { cors: true }));
  }
});
