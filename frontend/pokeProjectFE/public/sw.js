const CACHE_NAME = 'pokeapp-v4';
const API_CACHE_NAME = 'pokeapp-api-v3';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/faviconP.ico',
  '/manifest.json',
  '/assets/pikachuError.jpg',
  '/assets/pokemon.jpg',
  '/assets/Video1.mp4',
  '/assets/flace1.jpg',
  '/assets/flace2.jpg',
  '/assets/flace3.png',
  '/assets/flace4.png',
  '/assets/pikachu.png'
];

// ==================== INSTALACIÓN ====================
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      console.log('Service Worker instalándose...');
      
      // Cachear assets con manejo de errores individual
      const cachePromises = ASSETS_TO_CACHE.map(async (asset) => {
        try {
          await cache.add(asset);
        } catch (error) {
          console.warn(`No se pudo cachear ${asset}:`, error);
        }
      });
      
      await Promise.all(cachePromises);
      console.log(`Instalación completada con ${(await cache.keys()).length} items en caché`);
      
      // Activar el SW inmediatamente
      await self.skipWaiting();
    })()
  );
});

// ==================== ACTIVACIÓN ====================
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      console.log('Service Worker activándose...');
      
      // Limpiar caches antiguos
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames.map(async (cacheName) => {
          if (![CACHE_NAME, API_CACHE_NAME].includes(cacheName)) {
            console.log('Eliminando cache obsoleto:', cacheName);
            await caches.delete(cacheName);
          }
        })
      );
      
      // Tomar control de todos los clients
      await self.clients.claim();
      console.log('Service Worker activado y listo');
    })()
  );
});

// ==================== ESTRATEGIAS DE CACHÉ ====================

// Estrategia para API: Network First, luego Cache
const handleApiRequest = async (request) => {
  const cacheKey = request.url;
  const cache = await caches.open(API_CACHE_NAME);
  
  try {
    // 1. Intentar red primero si hay conexión
    if (navigator.onLine) {
      const networkResponse = await fetch(request);
      
      if (networkResponse.ok) {
        // Clonar la respuesta para cachearla
        const responseToCache = networkResponse.clone();
        
        // Normalizar datos antes de cachear
        const data = await responseToCache.json();
        if (data && !data.name && data.id) {
          data.name = `Pokémon ${data.id}`;
        }
        
        await cache.put(cacheKey, new Response(JSON.stringify(data), {
          headers: { 'Content-Type': 'application/json' }
        }));
        
        return networkResponse;
      }
    }

    // 2. Buscar en caché
    const cachedResponse = await cache.match(cacheKey);
    if (cachedResponse) {
      const data = await cachedResponse.json();
      
      // Verificar integridad de datos cacheados
      if (!data.name && data.id) {
        data.name = `Pokémon ${data.id}`;
        return new Response(JSON.stringify(data), {
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      return cachedResponse;
    }

    // 3. Fallback estructurado
    const pokemonId = new URL(request.url).pathname.split('/').pop();
    return new Response(JSON.stringify({
      id: pokemonId,
      name: `Pokémon ${pokemonId}`,
      sprite: '/assets/pikachuError.jpg',
      types: [],
      stats: [],
      abilities: [],
      __fallback: true
    }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200
    });

  } catch (error) {
    console.error('Error en handleApiRequest:', error);
    return new Response(JSON.stringify({
      error: "network_error",
      message: "No se pudo conectar al servidor"
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

// Estrategia para HTML: Network First, luego Cache
const handleHtmlRequest = async (request) => {
  const cache = await caches.open(CACHE_NAME);
  
  try {
    // 1. Intentar red primero
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Actualizar caché en background
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error('Respuesta de red no OK');
  } catch (error) {
    console.log('Usando caché para HTML:', error);
    
    // 2. Buscar en caché
    const cachedResponse = await cache.match(request) || 
                          await cache.match('/index.html');
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // 3. Fallback básico
    return new Response(
      '<h1>PokeApp Offline</h1><p>La aplicación no está disponible sin conexión</p>',
      { headers: { 'Content-Type': 'text/html' } }
    );
  }
};

// Estrategia para assets estáticos: Cache First, luego Network
const handleStaticRequest = async (request) => {
  // Ignorar URLs de desarrollo de Vite
  const url = new URL(request.url);
  if (url.href.includes('__vite_ping') || 
      url.href.includes('sockjs-node') ||
      url.href.includes('hot-update')) {
    return fetch(request);
  }

  // 1. Buscar en caché primero
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    // 2. Intentar red
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cachear para futuras solicitudes
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Error al cargar recurso estático:', request.url);
    
    // 3. Fallbacks específicos
    if (request.url.match(/\.(jpg|png|jpeg|gif|webp)$/i)) {
      return caches.match('/assets/pikachuError.jpg');
    }
    
    if (request.url.match(/\.css$/i)) {
      return new Response('', { headers: { 'Content-Type': 'text/css' } });
    }
    
    if (request.url.match(/\.js$/i)) {
      return new Response('console.log("Recurso no disponible offline");', {
        headers: { 'Content-Type': 'application/javascript' }
      });
    }
    
    return new Response('', { status: 404 });
  }
};

// ==================== MANEJADOR PRINCIPAL ====================
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorar métodos que no sean GET
  if (request.method !== 'GET') return;

  // Ignorar extensiones de desarrollo
  if (url.pathname.includes('__') || url.href.includes('hot-update')) {
    return;
  }

  // Routing de solicitudes
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
  } 
  else if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(handleHtmlRequest(request));
  } 
  else {
    event.respondWith(handleStaticRequest(request));
  }
});

// ==================== COMUNICACIÓN Y SINCRONIZACIÓN ====================

// Manejar mensajes desde la app
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
    self.clients.claim().then(() => {
      console.log('Service Worker actualizado y tomando control');
    });
  }
  
  if (event.data?.type === 'UPDATE_CACHE') {
    console.log('Actualizando caché desde mensaje');
    // Lógica para actualizar caché específica
  }
});

// Sincronización en background
self.addEventListener('sync', (event) => {
  if (event.tag === 'update-api-cache') {
    console.log('Sincronizando caché de API en background');
    // Lógica para actualizar datos importantes
  }
});

// Manejar notificaciones push
self.addEventListener('push', (event) => {
  const data = event.data?.json();
  event.waitUntil(
    self.registration.showNotification(data.title || 'PokeApp', {
      body: data.message || 'Nueva actualización disponible',
      icon: '/assets/pikachu.png'
    })
  );
});