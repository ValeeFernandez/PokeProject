const CACHE_NAME = 'pokeapp-v2';
const API_CACHE_NAME = 'pokeapp-api-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/faviconP.ico',
  '/manifest.json',
  '/assets/pikachuError.jpg',
  '/assets/pokemon.jpg',
  '/assets/video1.mp4',
  '/assets/video2.mp4',
  // Agrega más assets estáticos según necesites
];

// Al instalar, precacheamos los assets esenciales
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => {
      console.log('Assets precacheados correctamente');
      return self.skipWaiting();
    })
  );
});

// Activar: limpiar caches viejos
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
            console.log('Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker activado y caches limpiados');
      return self.clients.claim();
    })
  );
});

// Estrategia de caché para la API
const handleApiRequest = async (request) => {
  const isOnline = navigator.onLine;
  
  try {
    // 1. Si hay conexión, intentar la red primero
    if (isOnline) {
      const networkResponse = await fetch(request);
      
      if (networkResponse.ok) {
        const data = await networkResponse.clone().json();
        
        // Asegurarse de que los datos tengan la estructura correcta
        if (data && !data.name) {
          data.name = `Pokémon ${data.id}`; // Valor por defecto si falta el nombre
        }
        
        // Guardar en caché la respuesta normalizada
        const cache = await caches.open(API_CACHE_NAME);
        await cache.put(request, new Response(JSON.stringify(data), {
          headers: { 'Content-Type': 'application/json' }
        }));
        
        return networkResponse;
      }
    }

    // 2. Si estamos offline, buscar en caché
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      const data = await cachedResponse.json();
      
      // Si los datos cacheados no tienen nombre, agregar uno por defecto
      if (data && !data.name) {
        data.name = `Pokémon ${data.id}`;
        return new Response(JSON.stringify(data), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      return cachedResponse;
    }

    // 3. Si no hay caché, devolver un fallback con datos básicos
    const url = new URL(request.url);
    const pokemonId = url.pathname.split('/').pop(); // Extraer ID de la URL
    
    return new Response(
      JSON.stringify({
        id: pokemonId,
        name: `Pokémon ${pokemonId}`,
        sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`,
        types: [],
        __stale: true // Marcar como datos de respaldo
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error en handleApiRequest:', error);
    return new Response(
      JSON.stringify({ error: "server_error", message: "Error del servidor" }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// Estrategia para HTML (App Shell)
const handleHtmlRequest = async (request) => {
  try {
    // Intentamos primero la red
    const networkResponse = await fetch(request);
    
    // Si es una respuesta válida, la cacheamos
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    // Si falla, devolvemos el index.html del caché
    const cachedResponse = await caches.match('/index.html');
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Como último recurso, devolvemos la respuesta de red
    return networkResponse;
  } catch (error) {
    console.log('Error de red, devolviendo index.html del caché:', error);
    const cachedResponse = await caches.match('/index.html');
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Respuesta de fallback muy básica
    return new Response('<h1>PokeApp Offline</h1>', {
      headers: { 'Content-Type': 'text/html' }
    });
  }
};

// Estrategia para assets estáticos (Cache First)
const handleStaticRequest = async (request) => {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('Error al cargar recurso estático:', error);
    
    // Intentamos devolver un fallback según el tipo de recurso
    const url = new URL(request.url);
    
    if (url.pathname.endsWith('.jpg') || url.pathname.endsWith('.png')) {
      return caches.match('/assets/pikachuError.jpg');
    }
    
    if (url.pathname.endsWith('.css')) {
      return new Response('', { headers: { 'Content-Type': 'text/css' }});
    }
    
    if (url.pathname.endsWith('.js')) {
      return new Response('console.log("Recurso no disponible offline");', {
        headers: { 'Content-Type': 'application/javascript' }
      });
    }
    
    return new Response('Recurso no disponible offline', {
      status: 404,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
};

// Manejador principal de fetch
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const requestUrl = new URL(request.url);
  
  // Ignorar solicitudes que no sean GET
  if (request.method !== 'GET') return;
  
  // Ignorar solicitudes de extensiones de desarrollo
  if (requestUrl.pathname.includes('__') || 
      requestUrl.pathname.includes('hot-update') ||
      requestUrl.pathname.includes('sockjs-node')) {
    return;
  }
  
  // Manejar solicitudes de API
  if (requestUrl.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }
  
  // Manejar solicitudes de navegación (HTML)
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(handleHtmlRequest(request));
    return;
  }
  
  // Manejar assets estáticos
  event.respondWith(handleStaticRequest(request));
});

// Manejar actualizaciones en segundo plano
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Sincronización en segundo plano para actualizar caché
self.addEventListener('sync', (event) => {
  if (event.tag === 'updateApiCache') {
    console.log('Sincronización en segundo plano para actualizar caché');
    // Aquí podrías implementar lógica para actualizar datos importantes
  }
});