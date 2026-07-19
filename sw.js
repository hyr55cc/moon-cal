/**
 * moon Calendar - Service Worker
 * Enables offline functionality and PWA installation
 */

const CACHE_NAME = 'moon-calendar-v1.0.0';
const RUNTIME_CACHE = 'moon-runtime-v1';

const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './js/hijri.js',
  './js/storage.js',
  './js/ics.js',
  './js/notifications.js',
  './js/calendar.js',
  './js/app.js',
  './icons/icon-72.png',
  './icons/icon-96.png',
  './icons/icon-128.png',
  './icons/icon-144.png',
  './icons/icon-152.png',
  './icons/icon-192.png',
  './icons/icon-384.png',
  './icons/icon-512.png',
  'https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Tajawal:wght@400;500;700&family=Cormorant+Garamond:wght@500;700&display=swap'
];

// Install: cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        // Cache assets one-by-one to avoid failing on a single 404
        return Promise.allSettled(
          STATIC_ASSETS.map(url =>
            cache.add(url).catch(err => console.log('[SW] Failed to cache:', url, err))
          )
        );
      })
      .then(() => self.skipWaiting())
  );
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME && name !== RUNTIME_CACHE)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch: serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  // Skip non-GET requests
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // For Google Fonts - cache first, network fallback
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
          }
          return response;
        });
      }).catch(() => new Response('', { status: 408, statusText: 'Offline' }))
    );
    return;
  }

  // For same-origin requests: try cache first, then network
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        // Update in background (stale-while-revalidate)
        fetch(request).then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
        }).catch(() => {});
        return cached;
      }
      // Not in cache, try network
      return fetch(request).then((response) => {
        if (response && response.status === 200 && response.type === 'basic') {
          const clone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => cache.put(request, clone));
        }
        return response;
      }).catch(() => {
        // Offline fallback for navigation
        if (request.mode === 'navigate') {
          return caches.match('./index.html');
        }
        return new Response('Offline', { status: 408, statusText: 'Offline' });
      });
    })
  );
});

// Listen for messages from the app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Push notification handler (for future use with server)
self.addEventListener('push', (event) => {
  if (!event.data) return;
  const data = event.data.json();
  const options = {
    body: data.body || 'لديك تذكير من تقويم moon',
    icon: './icons/icon-192.png',
    badge: './icons/icon-96.png',
    dir: 'rtl',
    lang: 'ar',
    tag: data.tag || 'moon-notification',
    data: data.url || './',
    requireInteraction: true
  };
  event.waitUntil(
    self.registration.showNotification(data.title || 'moon تقويم', options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(event.notification.data || './');
      }
    })
  );
});
