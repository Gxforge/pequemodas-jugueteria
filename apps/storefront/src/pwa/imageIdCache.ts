const CACHE_BUCKET = 'pequemodas-img-by-id-v1';
const SYNTHETIC_ORIGIN = 'https://img-id.pequemodas.local';
const MAX_DISK_ENTRIES = 240;

export type ImageVariantStage = 'thumb' | 'hd';

// Capa 1 (RAM): acceso síncrono en 0.0 ms durante la sesión sin parpadeos
const memoryObjectUrls = new Map<string, string>();
const inflightDownloads = new Map<string, Promise<string>>();

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

async function trimIdCache(cache: Cache): Promise<void> {
  const keys = await cache.keys();
  if (keys.length <= MAX_DISK_ENTRIES) return;
  const excess = keys.slice(0, keys.length - MAX_DISK_ENTRIES);
  await Promise.all(excess.map((req) => cache.delete(req)));
}

/**
 * Resuelve una imagen por su UUID inmutable de `product_images.id`.
 * Si el `imageId` no ha cambiado, jamás vuelve a descargarla de la red:
 * sirve primero desde RAM (0 ms) y luego desde CacheStorage persistente.
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

      const netRes = await fetch(remoteUrl, { mode: 'cors', credentials: 'omit' });
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
    } catch {
      return remoteUrl;
    } finally {
      inflightDownloads.delete(memKey);
    }
  })();

  inflightDownloads.set(memKey, task);
  return task;
}
