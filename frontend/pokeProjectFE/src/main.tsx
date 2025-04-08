import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

// Función para registrar el Service Worker
const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });
      
      console.log('Service Worker registrado con éxito:', registration);

      // Verificar actualizaciones periódicamente
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('Nueva versión disponible!');
              // Aquí podrías mostrar un toast/banner al usuario para actualizar
            }
          });
        }
      });
    } catch (error) {
      console.error('Error al registrar el Service Worker:', error);
    }
  }
};

// Función para verificar la conexión
const checkConnection = () => {
  const handleConnectionChange = () => {
    console.log(`Estado de conexión: ${navigator.onLine ? 'online' : 'offline'}`);
    // Se pueden añadir eventos globales que yo quiera en esta parte
    document.dispatchEvent(new CustomEvent('connectionChange', {
      detail: { isOnline: navigator.onLine }
    }));
  };

  window.addEventListener('online', handleConnectionChange);
  window.addEventListener('offline', handleConnectionChange);
  handleConnectionChange(); // Verificar estado inicial
};

// Configuración inicial de la aplicación
const initializeApp = () => {
  // Registrar Service Worker cuando la app cargue
  window.addEventListener('load', () => {
    registerServiceWorker();
    checkConnection();
  });

 
  document.addEventListener('DOMContentLoaded', registerServiceWorker);
};

// Inicializar la aplicación
initializeApp();

// Renderizar la aplicación
const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Tipado para el evento personalizado
declare global {
  interface DocumentEventMap {
    'connectionChange': CustomEvent<{ isOnline: boolean }>;
  }
}