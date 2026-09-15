/*
 * KALA'S PWA Service Worker
 *
 * Conservative caching strategy — this is a production e-commerce site:
 *  - HTML navigations ....... network-first, cache fallback, offline.html last resort
 *  - /_next/static/* ........ cache-first (immutable, content-hashed by Next.js)
 *  - public images .......... cache-first (logo, icons, uploaded product images)
 *  - /api/*, /admin*, non-GET, HMR/dev assets ... network only, never cached
 *
 * Bump CACHE_VERSION to invalidate all caches on deploy.
 */
const CACHE_VERSION = 'kalas-pwa-v1'
const OFFLINE_URL = '/offline.html'

const PRECACHE_URLS = [
  OFFLINE_URL,
  '/logo.jpeg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-192.png',
  '/icons/icon-maskable-512.png',
  '/icons/apple-touch-icon.png',
]

// Allow the page to fast-forward a waiting worker (used by PWARegister)
self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting()
})

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_VERSION)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_VERSION).map((key) => caches.delete(key))
        )
      )
      .then(() => self.clients.claim())
  )
})

// Paths that must always hit the network (never cached, never intercepted)
const NETWORK_ONLY_PATTERNS = [
  '/api/',
  '/admin',
  '/_next/webpack-hmr',
  '/_next/static/development',
]

function isNetworkOnly(url) {
  if (url.origin !== self.location.origin) return true
  return NETWORK_ONLY_PATTERNS.some((p) => url.pathname.startsWith(p))
}

self.addEventListener('fetch', (event) => {
  const { request } = event

  // Only handle GET requests
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Never intercept sensitive/dynamic endpoints or dev tooling
  if (isNetworkOnly(url)) return

  // 1) Page navigations: network-first, cache fallback, offline page last resort
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful same-origin HTML copies for offline fallback
          if (response && response.ok && response.type === 'basic') {
            const copy = response.clone()
            caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy))
          }
          return response
        })
        .catch(async () => {
          const cached = await caches.match(request)
          if (cached) return cached
          const offline = await caches.match(OFFLINE_URL)
          return offline || new Response('Hors ligne', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
        })
    )
    return
  }

  // 2) Immutable Next.js static assets: cache-first
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response && response.ok) {
              const copy = response.clone()
              caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy))
            }
            return response
          })
      )
    )
    return
  }

  // 3) Public images (logo, icons, product uploads): cache-first with network fill
  if (
    (url.origin === self.location.origin &&
      (url.pathname.startsWith('/icons/') ||
        url.pathname.startsWith('/uploads/') ||
        url.pathname === '/logo.jpeg'))
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response && response.ok) {
              const copy = response.clone()
              caches.open(CACHE_VERSION).then((cache) => cache.put(request, copy))
            }
            return response
          })
      )
    )
    return
  }

  // 4) Everything else (RSC flights, fonts, external, etc.): plain network
  //    (left untouched — no respondWith)
})
