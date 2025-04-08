// sw.js
const CACHE_NAME = 'pokeapp-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json',
  '/faviconP.ico',
  '/assets/pikachuError.jpg',
  '/assets/pokemon.jpg',
  '/assets/video 1.mp4',
  '/assets/video2.mp4',
  // Agrega aquí otros assets estáticos
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
});

self.addEventListener('fetch', (event) => {
  // Estrategia Cache First para assets estáticos
  if (event.request.url.includes('/api/')) {
    // Para llamadas API: Network First con fallback a cache
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clonamos la respuesta para guardarla en cache
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    // Para assets estáticos: Cache First
    event.respondWith(
      caches.match(event.request)
        .then((response) => response || fetch(event.request))
    );
  }
});