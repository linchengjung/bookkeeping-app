const CACHE_NAME = 'jizhang-v2';
const ASSETS = [
  './',
  './index.html',
  './manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  // Only handle GET requests for our own origin
  if (e.request.method !== 'GET') return;
  // Don't cache API calls (yahoo finance, coingecko, dropbox, allorigins)
  const url = new URL(e.request.url);
  const externalHosts = ['query1.finance.yahoo.com','api.coingecko.com',
    'api.allorigins.win','content.dropboxapi.com','www.dropbox.com'];
  if (externalHosts.some(h => url.hostname.includes(h))) return;

  e.respondWith(
    caches.match(e.request)
      .then(cached => cached || fetch(e.request)
        .then(resp => {
          // Cache same-origin responses
          if (resp && resp.status === 200 && url.origin === location.origin) {
            const clone = resp.clone();
            caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
          }
          return resp;
        })
        .catch(() => caches.match('./index.html'))
      )
  );
});
