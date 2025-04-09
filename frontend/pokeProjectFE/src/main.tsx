import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Configuración avanzada del Service Worker
const registerServiceWorker = async () => {
  if (!('serviceWorker' in navigator)) return;

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none' // Para desarrollo con Vite
    });

    console.log('SW registrado:', registration);

    // Manejo de actualizaciones
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) return;

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          console.log('Nueva versión disponible');
          // Puedes emitir un evento para mostrar UI de actualización
          document.dispatchEvent(new CustomEvent('swUpdate', { detail: registration }));
        }
      });
    });

    // Forzar actualización en cada carga en desarrollo
    if (process.env.NODE_ENV === 'development') {
      await registration.update();
    }
  } catch (error) {
    console.error('Error en SW:', error);
  }
};

// Sistema de monitoreo de conexión mejorado
const setupConnectionMonitor = () => {
  const updateStatus = () => {
    const status = navigator.onLine ? 'online' : 'offline';
    console.log(`Estado de conexión: ${status}`);
    document.dispatchEvent(new CustomEvent('connectionChange', {
      detail: { isOnline: navigator.onLine }
    }));

    // Sincronizar con el Service Worker
    if (navigator.serviceWorker?.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'NETWORK_STATUS',
        status
      });
    }
  };

  window.addEventListener('online', updateStatus);
  window.addEventListener('offline', updateStatus);
  updateStatus(); // Estado inicial

  // Monitorear cambios en la calidad de la conexión
  if ('connection' in navigator) {
    (navigator as any).connection.addEventListener('change', updateStatus);
  }
};

// Inicialización de la aplicación
const initializeApp = () => {
  // Esperar a que cargue el DOM antes de registrar el SW
  if (document.readyState === 'complete') {
    registerServiceWorker();
  } else {
    window.addEventListener('load', registerServiceWorker);
  }

  setupConnectionMonitor();
};

// Renderizado de la aplicación
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  
  initializeApp();
  
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  console.error('No se encontró el elemento root');
}

// Tipados extendidos
declare global {
  interface DocumentEventMap {
    'connectionChange': CustomEvent<{ isOnline: boolean }>;
    'swUpdate': CustomEvent<ServiceWorkerRegistration>;
  }

  interface Navigator {
    connection?: {
      effectiveType: string;
      addEventListener: (type: string, listener: () => void) => void;
    };
  }
}