// public/sw.js
//
// Deliberately minimal. A service worker is one of the technical
// requirements Chrome/Android checks before it will consider the site
// "installable" (alongside a valid manifest + HTTPS) — but this app serves
// live, frequently-changing data (profiles, messages, wallet, admin stats),
// so we intentionally do NOT cache API responses or app pages. This just:
//   1. Caches the static PWA icons (safe — they don't change at runtime).
//   2. Falls back to those cached icons if the network is unavailable.
//   3. Otherwise gets out of the way and lets every request hit the network
//      as normal, so nothing here can ever serve stale profile/wallet data.
//
// If the app later wants a real offline experience, this is the place to
// extend — but that should be a deliberate follow-up, not a side effect of
// PWA installability.

const CACHE_NAME = "bluufun-static-v1";
const PRECACHE_URLS = [
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-512-maskable.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only ever intervene for our own precached static icons. Everything
  // else (pages, API calls, uploads) passes straight through to the
  // network untouched.
  const url = new URL(request.url);
  if (request.method !== "GET" || !PRECACHE_URLS.includes(url.pathname)) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request)),
  );
});
