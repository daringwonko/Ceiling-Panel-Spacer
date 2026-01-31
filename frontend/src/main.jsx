import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './styles/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Register service worker for offline capabilities
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('[App] Service worker registered:', registration.scope);

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          console.log('[App] New service worker found');

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed') {
              if (navigator.serviceWorker.controller) {
                console.log('[App] New content available, refresh to update');
              } else {
                console.log('[App] Content cached for offline use');
              }
            }
          });
        });

        // Handle controller change (new SW became active)
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('[App] New service worker active, reload to apply updates');
        });
      })
      .catch((error) => {
        console.error('[App] Service worker registration failed:', error);
      });
  });
}
