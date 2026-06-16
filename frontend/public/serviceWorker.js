// Web Worker(run in background) handle background and offline tasks -> add medium story

const CACHE_NAME = 'calorie-tracker-v-1.0.0.1';
const APP_SHELL = [
  '/',
  '/index.html',
  '/offline.html',
  '/manifest.json',
  '/favicon.svg',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png'
];

const STATIC_DESTINATIONS = new Set(['style', 'script', 'worker', 'font', 'image']);

// Install service work without thinking of older tabs
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting()) // Don't wait for old tabs/pages to close. Activate this new Service Worker immediately.
  );
});

// Activate the service worker as soon as older cache deletes
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) =>
        Promise.all(
          cacheNames
            .filter((cacheName) => cacheName !== CACHE_NAME)
            .map((cacheName) => caches.delete(cacheName))
        )
      )
      .then(() => self.clients.claim())
  );
});

// return cache for GET APIs
self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request));
    return;
  }

  if (url.origin !== self.location.origin) return;

  if (STATIC_DESTINATIONS.has(request.destination) || isKnownPublicAsset(url.pathname)) {
    event.respondWith(cacheFirst(request));
  }
});

// Use network, if network fail then go for cache
async function handleNavigation(request) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put('/index.html', networkResponse.clone());
    }

    return networkResponse;
  } catch {
    return (
      (await caches.match('/index.html')) ||
      (await caches.match('/offline.html')) ||
      new Response('Offline', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      })
    );
  }
}

async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) return cachedResponse;

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch {
    return (
      new Response('Asset unavailable offline', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      })
    );
  }
}

function isKnownPublicAsset(pathname) {
  return APP_SHELL.includes(pathname) || pathname.startsWith('/assets/');
}
