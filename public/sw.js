const CACHE_NAME = 'pkxd-central-cache-v4';
const SITE_FAVICON = '/assets/aistudio/file_000000004688820e877cea70c3a4dcc9_6049124b.png';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  SITE_FAVICON,
  '/favicon.png'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('Pre-cache warning:', err);
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event: Network-first with cache fallback for navigation & static cache for assets
self.addEventListener('fetch', (event) => {
  const req = event.request;
  
  // Skip non-GET or chrome-extension or external cross-origin requests that might fail
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // CRITICAL: NEVER intercept or cache /api/ requests with ServiceWorker!
  if (url.pathname.startsWith('/api/') || url.pathname === '/api') {
    return;
  }

  // Network first for HTML/navigation requests
  if (req.mode === 'navigate' || req.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(req)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const cacheCopy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, cacheCopy));
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(req).then((cachedResponse) => {
            return cachedResponse || caches.match('/index.html');
          });
        })
    );
    return;
  }

  // Cache first for static assets (images, js, css, fonts)
  if (
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.jpg') ||
    url.pathname.endsWith('.svg') ||
    url.pathname.endsWith('.webp')
  ) {
    event.respondWith(
      caches.match(req).then((cachedResponse) => {
        if (cachedResponse) {
          // Fetch fresh in background
          fetch(req).then((netResp) => {
            if (netResp && netResp.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(req, netResp));
            }
          }).catch(() => {});
          return cachedResponse;
        }
        return fetch(req).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const cacheCopy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(req, cacheCopy));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // Default network with cache fallback
  event.respondWith(
    fetch(req)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && url.origin === self.location.origin) {
          const cacheCopy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, cacheCopy));
        }
        return networkResponse;
      })
      .catch(() => caches.match(req))
  );
});

// Push notification handling
self.addEventListener('push', function(event) {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'Notificação', body: event.data.text() };
    }
  }

  const title = data.title || 'Novidade no PKXD Central! 🔔';
  const options = {
    body: data.body || 'Abra o aplicativo para conferir os novos eventos, pets e spoilers.',
    icon: SITE_FAVICON,
    badge: SITE_FAVICON,
    vibrate: [120, 60, 120],
    requireInteraction: false,
    data: {
      url: data.url || '/notificacoes'
    }
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const urlToOpen = (event.notification.data && event.notification.data.url) || '/notificacoes';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(windowClients) {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if ('focus' in client) {
          if ('navigate' in client && urlToOpen) {
            try {
              client.navigate(urlToOpen);
            } catch (e) {}
          }
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
