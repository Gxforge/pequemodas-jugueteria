const ADMIN_SHELL_CACHE = 'pequemodas-admin-shell-v2';
const ADMIN_IMMUTABLE_CACHE = 'pequemodas-admin-immutable-v2';
const ADMIN_MEDIA_CACHE = 'pequemodas-admin-media-v2';

const ADMIN_SHELL_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.png',
  '/icons/icon-192.png',
  '/brand/logo-foreground.webp',
  '/brand/cloud-wide.webp',
  '/brand/cloud-side.webp'
];

const ACTIVE_CACHES = [ADMIN_SHELL_CACHE, ADMIN_IMMUTABLE_CACHE, ADMIN_MEDIA_CACHE];

function isUsableAsset(res) {
  if (!res || res.status !== 200) return false;
  const type = res.headers.get('content-type') || '';
  return /javascript|css/i.test(type);
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(ADMIN_SHELL_CACHE).then((cache) => cache.addAll(ADMIN_SHELL_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => !ACTIVE_CACHES.includes(k))
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

  // 1. Imágenes públicas de productos/marca en Supabase Storage: Cache-First
  if (
    url.hostname.includes('supabase.co') &&
    (url.pathname.includes('/storage/v1/object/public/product-images/') ||
      url.pathname.includes('/storage/v1/object/public/brand-assets/'))
  ) {
    event.respondWith(
      caches.open(ADMIN_MEDIA_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (cached) return cached;
        const res = await fetch(request);
        if (res && res.status === 200) {
          cache.put(request, res.clone());
        }
        return res;
      })
    );
    return;
  }

  // 2. Jamás cachear consultas dinámicas de Supabase, Auth, Edge Functions ni version.json
  if (
    url.pathname === '/version.json' ||
    url.hostname.includes('supabase.co') ||
    url.pathname.startsWith('/rest/') ||
    url.pathname.startsWith('/auth/') ||
    url.pathname.startsWith('/functions/')
  ) {
    return;
  }

  // 3. Navegación SPA del panel: Network-First rápido con respaldo instantáneo de caché
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const controller = new self.AbortController();
          const timer = self.setTimeout(() => controller.abort(), 4000);
          const netRes = await fetch(request, { signal: controller.signal });
          self.clearTimeout(timer);
          if (netRes && netRes.status === 200) {
            const cache = await caches.open(ADMIN_SHELL_CACHE);
            cache.put('/index.html', netRes.clone());
          }
          return netRes;
        } catch {
          const cachedShell = await caches.match('/index.html');
          return cachedShell || self.Response.error();
        }
      })()
    );
    return;
  }

  if (url.origin !== self.location.origin) return;

  // 4. Módulos JS/CSS con hash (/assets/*): Cache-First instantáneo (0 ms)
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.open(ADMIN_IMMUTABLE_CACHE).then(async (cache) => {
        const cached = await cache.match(request);
        if (isUsableAsset(cached)) return cached;
        if (cached) await cache.delete(request);
        try {
          const res = await fetch(request);
          if (isUsableAsset(res)) cache.put(request, res.clone());
          return res;
        } catch {
          return self.Response.error();
        }
      })
    );
    return;
  }

  // 5. Recursos de marca (/brand/*, /icons/*): Stale-While-Revalidate
  event.respondWith(
    caches.open(ADMIN_SHELL_CACHE).then(async (cache) => {
      const cached = await cache.match(request);
      const net = fetch(request)
        .then((res) => {
          if (res && res.status === 200) cache.put(request, res.clone());
          return res;
        })
        .catch(() => cached);
      return cached || net;
    })
  );
});
