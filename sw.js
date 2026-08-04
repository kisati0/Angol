// Service Worker a Szómondó 1 alkalmazáshoz
// Verzió: v27 - profilkezeléssel

const CACHE = 'szomondo-1-v27';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  const url = new URL(e.request.url);
  if (url.pathname.includes('/api/') || 
      url.pathname.includes('translate') ||
      url.hostname.includes('translate.googleapis.com') ||
      url.hostname.includes('api.mymemory.translated.net') ||
      url.hostname.includes('lingva.ml')) {
    e.respondWith(fetch(e.request).catch(() => {
      return new Response('Hálózati hiba', { status: 503 });
    }));
    return;
  }

  e.respondWith(
    fetch(e.request)
      .then(response => {
        if (response && response.status === 200) {
          const copy = response.clone();
          caches.open(CACHE)
            .then(cache => cache.put(e.request, copy))
            .catch(() => {});
        }
        return response;
      })
      .catch(() => {
        return caches.match(e.request)
          .then(cached => {
            if (cached) return cached;
            return caches.match('./index.html');
          });
      })
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'PROFILE_CHANGED') {
    caches.open(CACHE)
      .then(cache => {
        return fetch('./index.html')
          .then(response => {
            if (response && response.status === 200) {
              cache.put('./index.html', response);
            }
          })
          .catch(() => {});
      });
  }
});