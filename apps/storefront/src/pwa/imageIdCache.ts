const CACHE_BUCKET = 'pequemodas-img-by-id-v1';
const SYNTHETIC_ORIGIN = 'https://img-id.pequemodas.local';
const MAX_DISK_ENTRIES = 240;
const MAX_CONCURRENT_NET_DOWNLOADS = 3;
const NET_IMAGE_TIMEOUT_MS = 14_000;

export type ImageVariantStage = 'thumb' | 'hd';

// Capa 1 (RAM): acceso síncrono en 0.0 ms durante la sesión sin parpadeos
const memoryObjectUrls = new Map<string, string>();
const inflightDownloads = new Map<string, Promise<string>>();

// Cola ligera de red para no saturar conexiones móviles lentas (3G/4G inestable)
let activeNetCount = 0;
const pendingQueue: Array<() => void> = [];

function acquireNetSlot(): Promise<void> {
  if (activeNetCount < MAX_CONCURRENT_NET_DOWNLOADS) {
    activeNetCount += 1;
    return Promise.resolve();
  }
  return new Promise<void>((resolve) => {
    pendingQueue.push(() => {
      activeNetCount += 1;
      resolve();
    });
  });
}

function releaseNetSlot(): void {
  activeNetCount = Math.max(0, activeNetCount - 1);
  const next = pendingQueue.shift();
  if (next) next();
}

function makeMemoryKey(imageId: string, variant: ImageVariantStage): string {
  return `${imageId}:${variant}`;
}

function makeCacheKeyUrl(imageId: string, variant: ImageVariantStage): string {
  return `${SYNTHETIC_ORIGIN}/id/${encodeURIComponent(imageId)}/${variant}`;
}

function blobToDisplayUrl(blob: Blob, fallbackUrl: string): string {
  if (typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
    return URL.createObjectURL(blob);
  }
  return fallbackUrl;
}

export function peekCachedImageInRam(
  imageId: string | null | undefined,
  variant: ImageVariantStage
): string | null {
  if (!imageId) return null;
  return memoryObjectUrls.get(makeMemoryKey(imageId, variant)) ?? null;
}

export function clearMemoryImageEntry(
  imageId: string | null | undefined,
  variant: ImageVariantStage
): void {
  if (!imageId) return;
  memoryObjectUrls.delete(makeMemoryKey(imageId, variant));
}

async function trimIdCache(cache: Cache): Promise<void> {
  const keys = await cache.keys();
  if (keys.length <= MAX_DISK_ENTRIES) return;
  const excess = keys.slice(0, keys.length - MAX_DISK_ENTRIES);
  await Promise.all(excess.map((req) => cache.delete(req)));
}

/**
 * Resuelve una imagen por su UUID inmutable de `product_images.id`.
 * 1) Sirve al instante desde RAM (0 ms) o CacheStorage local sin pasar por cola de red.
 * 2) Si requiere red, limita descargas paralelas a 3 para no bloquear datos ni texto en señal lenta.
 */
export async function resolveImageById(
  imageId: string | null | undefined,
  variant: ImageVariantStage,
  remoteUrl: string
): Promise<string> {
  if (!imageId || typeof window === 'undefined' || !('caches' in window)) {
    return remoteUrl;
  }

  const memKey = makeMemoryKey(imageId, variant);
  const inRam = memoryObjectUrls.get(memKey);
  if (inRam) return inRam;

  const existingPromise = inflightDownloads.get(memKey);
  if (existingPromise) return existingPromise;

  const task = (async (): Promise<string> => {
    const cacheUrl = makeCacheKeyUrl(imageId, variant);
    try {
      const cache = await window.caches.open(CACHE_BUCKET);
      const diskHit = await cache.match(cacheUrl);
      if (diskHit) {
        const blob = await diskHit.blob();
        if (blob.size > 0) {
          const objUrl = blobToDisplayUrl(blob, remoteUrl);
          memoryObjectUrls.set(memKey, objUrl);
          return objUrl;
        }
      }

      await acquireNetSlot();
      try {
        const controller = new window.AbortController();
        const timer = window.setTimeout(() => controller.abort(), NET_IMAGE_TIMEOUT_MS);
        const netRes = await fetch(remoteUrl, {
          mode: 'cors',
          credentials: 'omit',
          signal: controller.signal
        });
        window.clearTimeout(timer);

        if (!netRes.ok) return remoteUrl;

        const blob = await netRes.blob();
        if (blob.size > 0) {
          await cache.put(
            cacheUrl,
            new Response(blob, {
              headers: {
                'Content-Type': blob.type || 'image/webp',
                'X-Image-Id': imageId,
                'X-Variant': variant
              }
            })
          );
          void trimIdCache(cache);
          const objUrl = blobToDisplayUrl(blob, remoteUrl);
          memoryObjectUrls.set(memKey, objUrl);
          return objUrl;
        }
        return remoteUrl;
      } finally {
        releaseNetSlot();
      }
    } catch {
      return remoteUrl;
    } finally {
      inflightDownloads.delete(memKey);
    }
  })();

  inflightDownloads.set(memKey, task);
  return task;
}
