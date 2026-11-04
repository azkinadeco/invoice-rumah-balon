/* Rumah Balon — offline app shell service worker.
 *
 * - Pages: network-first, falls back to the cached app shell when offline.
 * - /_next/static/*: cache-first (file names are content-hashed, never change).
 * - Images / fonts / manifest: stale-while-revalidate.
 * - Cross-origin requests (Supabase API) are never touched or cached: data
 *   always comes from the network or the app's own localStorage queue.
 */
const VERSION = 'rb-v1';
const SHELL_CACHE = `${VERSION}-shell`;
const STATIC_CACHE = `${VERSION}-static`;
const ASSET_CACHE = `${VERSION}-assets`;

const PRECACHE = [
  '/',
  '/manifest.json',
  '/images/logo.png',
  '/images/balloon_single.png',
  '/images/balloon_bunch.png',
  '/fonts/Lepetitcochon.ttf',
  '/fonts/DO-Sans.ttf',
  '/fonts/Lazydog.ttf',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      // addAll fails as a whole if one file is missing, so add one by one.
      .then((cache) => Promise.all(PRECACHE.map((url) => cache.add(url).catch(() => undefined))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Supabase & other APIs: untouched
  if (url.pathname.startsWith('/_next/webpack-hmr') || url.pathname.startsWith('/__nextjs')) return;

  // 1. Page navigations: network-first, offline fallback to cached shell
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(SHELL_CACHE).then((c) => c.put('/', copy));
          }
          return res;
        })
        .catch(() => caches.match('/', { cacheName: SHELL_CACHE }).then((r) => r || Response.error()))
    );
    return;
  }

  // 2. Hashed build assets: cache-first
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(req).then(
        (hit) =>
          hit ||
          fetch(req).then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(STATIC_CACHE).then((c) => c.put(req, copy));
            }
            return res;
          })
      )
    );
    return;
  }

  // 3. Images, fonts, manifest, optimized images: stale-while-revalidate
  if (
    url.pathname.startsWith('/images/') ||
    url.pathname.startsWith('/fonts/') ||
    url.pathname.startsWith('/_next/image') ||
    url.pathname === '/manifest.json'
  ) {
    event.respondWith(
      caches.match(req).then((hit) => {
        const network = fetch(req)
          .then((res) => {
            if (res.ok) {
              const copy = res.clone();
              caches.open(ASSET_CACHE).then((c) => c.put(req, copy));
            }
            return res;
          })
          .catch(() => hit);
        return hit || network;
      })
    );
  }
});
