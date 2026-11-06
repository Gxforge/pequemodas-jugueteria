import { STORAGE_LIMITS } from '@pequemodas/config';

export interface ImageValidationResult {
  valid: boolean;
  error?: string;
}

export interface OptimizedImagePair {
  fullBlob: Blob;
  thumbnailBlob: Blob;
  mimeType: string;
  extension: 'webp' | 'jpg';
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

function renderCanvasToBlob(
  img: HTMLImageElement,
  maxDim: number,
  quality: number
): Promise<{ blob: Blob; mimeType: string; extension: 'webp' | 'jpg'; width: number; height: number }> {
  const { width, height } = computeTargetSize(img.naturalWidth || img.width, img.naturalHeight || img.height, maxDim);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('No se pudo inicializar el procesador gráfico en el navegador.');
  }
  ctx.drawImage(img, 0, 0, width, height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (webpBlob) => {
        if (webpBlob && webpBlob.type === 'image/webp') {
          resolve({ blob: webpBlob, mimeType: 'image/webp', extension: 'webp', width, height });
          return;
        }
        canvas.toBlob(
          (jpegBlob) => {
            if (!jpegBlob) {
              reject(new Error('Error al comprimir la imagen seleccionada.'));
              return;
            }
            resolve({ blob: jpegBlob, mimeType: 'image/jpeg', extension: 'jpg', width, height });
          },
          'image/jpeg',
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
  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error(`No se pudo leer la imagen "${file.name}".`));
      el.src = objectUrl;
    });

    const full = await renderCanvasToBlob(
      img,
      STORAGE_LIMITS.fullImageMaxDimension,
      STORAGE_LIMITS.webpQuality
    );
    const thumb = await renderCanvasToBlob(
      img,
      STORAGE_LIMITS.thumbnailMaxDimension,
      0.78
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
