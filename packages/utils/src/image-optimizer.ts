import { STORAGE_LIMITS } from '@pequemodas/config';

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

export interface OptimizedImagePair {
  fullBlob: Blob;
  thumbnailBlob: Blob;
  mimeType: string;
  extension: 'webp' | 'jpg' | 'png';
  width: number;
  height: number;
}

export function validateImageFile(
  file: Pick<File, 'type' | 'size' | 'name'>,
  maxSizeBytes: number = STORAGE_LIMITS.maxFileSizeBytes
): ImageValidationResult {
  const allowed: readonly string[] = STORAGE_LIMITS.allowedMimeTypes;
  if (!allowed.includes(file.type)) {
    return {
      valid: false,
      error: `Formato no permitido (${file.type || 'desconocido'}). Usa JPG, PNG o WebP.`
    };
  }
  if (file.size <= 0) {
    return { valid: false, error: 'El archivo seleccionado está vacío.' };
  }
  if (file.size > maxSizeBytes) {
    const maxMb = Math.round((maxSizeBytes / (1024 * 1024)) * 10) / 10;
    return {
      valid: false,
      error: `La imagen "${file.name}" supera el límite de ${maxMb} MB.`
    };
  }
  return { valid: true };
}

export function buildUniqueStoragePath(
  folder: string,
  extension: 'webp' | 'jpg' | 'png'
): string {
  const cleanFolder = folder.replace(/^\/+|\/+$/g, '');
  const randomPart =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36)}`;
  return `${cleanFolder}/${Date.now()}-${randomPart}.${extension}`;
}

function computeTargetSize(
  srcWidth: number,
  srcHeight: number,
  maxDim: number
): { width: number; height: number } {
  if (srcWidth <= maxDim && srcHeight <= maxDim) {
    return { width: srcWidth, height: srcHeight };
  }
  const ratio = srcWidth / srcHeight;
  if (srcWidth >= srcHeight) {
    return { width: maxDim, height: Math.max(1, Math.round(maxDim / ratio)) };
  }
  return { width: Math.max(1, Math.round(maxDim * ratio)), height: maxDim };
}

function renderHighFidelityWebp(
  img: HTMLImageElement,
  maxDim: number,
  quality: number,
  preserveAlphaFallback: boolean
): Promise<{
  blob: Blob;
  mimeType: string;
  extension: 'webp' | 'jpg' | 'png';
  width: number;
  height: number;
}> {
  const { width, height } = computeTargetSize(
    img.naturalWidth || img.width,
    img.naturalHeight || img.height,
    maxDim
  );
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) {
    throw new Error('No se pudo inicializar el procesador gráfico en el navegador.');
  }
  // Preserva canal alfa (sin rellenar de blanco) y aplica interpolación bicúbica alta
  ctx.clearRect(0, 0, width, height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (webpBlob) => {
        if (webpBlob && webpBlob.type === 'image/webp') {
          resolve({
            blob: webpBlob,
            mimeType: 'image/webp',
            extension: 'webp',
            width,
            height
          });
          return;
        }
        const fallbackMime = preserveAlphaFallback ? 'image/png' : 'image/jpeg';
        const fallbackExt = preserveAlphaFallback ? 'png' : 'jpg';
        canvas.toBlob(
          (fbBlob) => {
            if (!fbBlob) {
              reject(new Error('Error al procesar la imagen seleccionada.'));
              return;
            }
            resolve({
              blob: fbBlob,
              mimeType: fallbackMime,
              extension: fallbackExt,
              width,
              height
            });
          },
          fallbackMime,
          quality
        );
      },
      'image/webp',
      quality
    );
  });
}

export async function optimizeProductImage(file: File): Promise<OptimizedImagePair> {
  const validation = validateImageFile(file);
  if (!validation.valid) {
    throw new Error(validation.error);
  }
  const hasAlphaSource = file.type === 'image/png' || file.type === 'image/webp';
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error(`No se pudo leer la imagen "${file.name}".`));
      el.src = objectUrl;
    });

    // Etapa 2 (Detalle HD): hasta 1800px con calidad 0.93 casi sin pérdida visual
    const full = await renderHighFidelityWebp(
      img,
      STORAGE_LIMITS.fullImageMaxDimension,
      STORAGE_LIMITS.webpQuality,
      hasAlphaSource
    );
    // Etapa 1 (Catálogo Retina): hasta 640px con calidad 0.90 nítida y rápida
    const thumb = await renderHighFidelityWebp(
      img,
      STORAGE_LIMITS.thumbnailMaxDimension,
      STORAGE_LIMITS.thumbnailQuality,
      hasAlphaSource
    );

    return {
      fullBlob: full.blob,
      thumbnailBlob: thumb.blob,
      mimeType: full.mimeType,
      extension: full.extension,
      width: full.width,
      height: full.height
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
