const SHELL_CACHE = 'pequemodas-shell-v3';
const IMMUTABLE_CACHE = 'pequemodas-immutable-v3';
const MEDIA_CACHE = 'pequemodas-media-v3';
const IMAGE_ID_CACHE = 'pequemodas-img-by-id-v1';
const MAX_MEDIA_ENTRIES = 160;

const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.png',
  '/icons/icon-192.png',
  '/brand/logo-foreground.webp',
  '/brand/cloud-wide.webp',
  '/brand/cloud-side.webp'
];

const ACTIVE_CACHES = [SHELL_CACHE, IMMUTABLE_CACHE, MEDIA_CACHE, IMAGE_ID_CACHE];

async function trimCache(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length > maxItems) {
    const excess = keys.slice(0, keys.length - maxItems);
    await Promise.all(excess.map((req) => cache.delete(req)));
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => !ACTIVE_CACHES.includes(key))
          .map((oldKey) => caches.delete(oldKey))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // 1. Imágenes públicas inmutables de Storage (UUID): Cache-First con límite LRU (ahorra datos móviles)
  if (
    url.hostname.includes('supabase.co') &&
    (url.pathname.includes('/storage/v1/object/public/product-images/') ||
      url.pathname.includes('/storage/v1/object/public/brand-assets/'))
  ) {
    event.respondWith(
      caches.open(MEDIA_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response && response.status === 200) {
          cache.put(request, response.clone());
          trimCache(MEDIA_CACHE, MAX_MEDIA_ENTRIES);
        }
        return response;
      })
    );
    return;
  }

  // 2. REGLA SAGRADA: Jamás cachear consultas dinámicas de stock, precios, version.json, RPC o Auth
  if (
    url.pathname === '/version.json' ||
    url.hostname.includes('supabase.co') ||
    url.pathname.startsWith('/rest/') ||
    url.pathname.startsWith('/auth/') ||
    url.pathname.startsWith('/functions/') ||
    url.pathname.startsWith('/rpc/')
  ) {
    return;
  }

  // 3. Navegación SPA: Network-First con timeout rápido (4.5s) y respaldo Offline del App Shell
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const controller = new self.AbortController();
          const timer = self.setTimeout(() => controller.abort(), 4500);
          const networkRes = await fetch(request, { signal: controller.signal });
          self.clearTimeout(timer);
          if (networkRes && networkRes.status === 200) {
            const cache = await caches.open(SHELL_CACHE);
            cache.put('/index.html', networkRes.clone());
          }
          return networkRes;
        } catch {
          const cachedShell = await caches.match('/index.html');
          return cachedShell || self.Response.error();
        }
      })()
    );
    return;
  }

  if (url.origin !== self.location.origin) return;

  // 4. Bundles de Vite con hash (/assets/*): Cache-First inmutable (0 ms en visitas repetidas)
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.open(IMMUTABLE_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response && response.status === 200) {
          cache.put(request, response.clone());
        }
        return response;
      })
    );
    return;
  }

  // 5. Recursos de marca e iconos (/brand/*, /icons/*): Stale-While-Revalidate
  event.respondWith(
    caches.open(SHELL_CACHE).then(async (cache) => {
      const cached = await cache.match(request);
      const networkFetch = fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            cache.put(request, response.clone());
          }
          return response;
        })
        .catch(() => cached);
      return cached || networkFetch;
    })
  );
});
