// Basic Service Worker for Pegish
const CACHE_NAME = 'pegish-v1';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './manifest.json',
  './scripts/main.js',
  './scripts/game.js',
  './scripts/cannon.js',
  './scripts/ball.js',
  './scripts/peg.js',
  './gameVariables.json',
  './icons/icon-placeholder.svg'
];

// Install event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)      .then(cache => {
        return cache.addAll(ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return the response from the cached version
        if (response) {
          return response;
        }
        
        // Not in cache - return the result from the live server
        // Clone the request because it's a one-time use stream
        return fetch(event.request).then(response => {        // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Check if the URL is valid for caching (avoid chrome-extension:// URLs)
          const url = new URL(event.request.url);
          if (url.protocol === 'chrome-extension:') {
            return response;
          }

          // Clone the response for the browser and the cache
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then(cache => {              try {
                cache.put(event.request, responseToCache);
              } catch (error) {
                // Silently handle caching errors
              }
            });

          return response;
        });
      })
  );
});
