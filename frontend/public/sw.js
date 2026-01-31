const CACHE_NAME = 'ceiling-panel-calculator-v2.0.0';
const STATIC_CACHE = 'ceiling-panel-static-v2.0.0';
const DYNAMIC_CACHE = 'ceiling-panel-dynamic-v2.0.0';

// Static resources to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/src/main.jsx',
  '/src/App.jsx',
  '/favicon.ico',
  // Add any critical fonts, icons, or core assets
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
];

// API endpoints to cache with limited expiry
const API_ASSETS = [
  '/api/calculator/layout',
  '/api/materials',
  '/api/gaps'
];

self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[Service Worker] Caching static assets');
      return cache.addAll(STATIC_ASSETS);
    }).catch((error) => {
      console.log('[Service Worker] Error caching static assets:', error);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating');

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            // Remove old caches that don't match current version
            return cacheName.startsWith('ceiling-panel-') &&
                   cacheName !== STATIC_CACHE &&
                   cacheName !== DYNAMIC_CACHE;
          })
          .map((cacheName) => {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
  );

  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Handle API requests with network-first strategy
  if (request.url.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful API responses (except mutations)
          if (response.ok && request.method === 'GET') {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Return cached version if available
          return caches.match(request);
        })
    );
    return;
  }

  // Handle static assets with cache-first strategy
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(request)
        .then((response) => {
          // Cache static assets (CSS, JS, images, fonts, etc.)
          if (response.ok && isCacheableAsset(request.url)) {
            const responseClone = response.clone();
            caches.open(DYNAMIC_CACHE).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Return offline fallback if supported
          if (request.url.includes('/index.html') || request.url.endsWith('/')) {
            return caches.match('/');
          }
        });
    })
  );
});

// Helper function to determine if an asset should be cached
function isCacheableAsset(url) {
  const cacheableExtensions = ['.css', '.js', '.png', '.jpg', '.jpeg', '.svg', '.woff', '.woff2', '.ttf'];
  const isApiRequest = url.includes('/api/');
  const hasCacheableExtension = cacheableExtensions.some(ext => url.endsWith(ext));

  return hasCacheableExtension && !isApiRequest;
}

// Background sync for when connectivity is restored
self.addEventListener('sync', (event) => {
  console.log('[Service Worker] Background sync:', event.tag);

  if (event.tag === 'calculation-request') {
    // Retry any pending calculations
    event.waitUntil(handleBackgroundSync());
  }
});

async function handleBackgroundSync() {
  // Implementation for retrying failed requests
  console.log('[Service Worker] Handling background calculations');
}

// Periodic background sync for auto-updates
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'update-check') {
    event.waitUntil(
      checkForUpdates()
    );
  }
});

async function checkForUpdates() {
  // Check for new versions of cached data
  console.log('[Service Worker] Checking for updates');
}

console.log('[Service Worker] Loaded version', CACHE_NAME);