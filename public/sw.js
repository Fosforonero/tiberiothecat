// SplitVote Service Worker — minimal offline fallback.
// Strategy: network-first for all navigation. On failure, serve /offline.
// No aggressive caching to avoid stale content after Vercel deploys.

const CACHE = 'sv-shell-v1'
const OFFLINE = '/offline'

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll([OFFLINE])).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (e) => {
  // Only intercept same-origin navigation requests (GET, not API/assets).
  const req = e.request
  if (req.method !== 'GET') return
  if (!req.url.startsWith(self.location.origin)) return
  if (req.url.includes('/api/')) return

  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).catch(() =>
        caches.open(CACHE).then((c) => c.match(OFFLINE))
      )
    )
  }
})
