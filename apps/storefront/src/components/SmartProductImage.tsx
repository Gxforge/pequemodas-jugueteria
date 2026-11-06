import React, { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import {
  peekCachedImageInRam,
  resolveImageById
} from '../pwa/imageIdCache';

export interface SmartProductImageProps {
  imageId?: string | null;
  thumbUrl?: string | null;
  fullUrl?: string | null;
  alt: string;
  mode: 'thumb' | 'detail-hd';
  className?: string;
  onHdReadyChange?: (hdReady: boolean) => void;
}

/**
 * Imagen Inteligente en 2 Etapas con Caché Inmutable por ID:
 * - `mode="thumb"` (Catálogo): descarga solo la miniatura Retina nítida (640px, q=0.90)
 *   y la guarda por `imageId` para no volver a descargarla jamás si el ID no cambia.
 * - `mode="detail-hd"` (Detalle): pinta al instante (0 ms) la miniatura ya cacheada
 *   mientras descarga en paralelo la versión de Alta Resolución (1800px, q=0.93) y hace
 *   transición limpia sin parpadeos.
 */
export function SmartProductImage({
  imageId,
  thumbUrl,
  fullUrl,
  alt,
  mode,
  className = '',
  onHdReadyChange
}: SmartProductImageProps) {
  const effectiveThumb = thumbUrl || fullUrl || null;
  const effectiveHd = fullUrl || thumbUrl || null;

  const initialSrc =
    mode === 'detail-hd'
      ? peekCachedImageInRam(imageId, 'hd') ||
        peekCachedImageInRam(imageId, 'thumb')
      : peekCachedImageInRam(imageId, 'thumb');

  const [displaySrc, setDisplaySrc] = useState<string | null>(initialSrc);
  const [isHdLoaded, setIsHdLoaded] = useState<boolean>(() =>
    mode === 'detail-hd' ? Boolean(peekCachedImageInRam(imageId, 'hd')) : false
  );
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setFailed(false);

    if (!effectiveThumb) {
      setDisplaySrc(null);
      return;
    }

    const ramHd = mode === 'detail-hd' ? peekCachedImageInRam(imageId, 'hd') : null;
    if (ramHd) {
      setDisplaySrc(ramHd);
      setIsHdLoaded(true);
      onHdReadyChange?.(true);
      return;
    }

    const ramThumb = peekCachedImageInRam(imageId, 'thumb');
    if (ramThumb) {
      setDisplaySrc(ramThumb);
    }

    // Paso 1: Resolver miniatura nítida desde caché por ID
    void resolveImageById(imageId, 'thumb', effectiveThumb).then((resolvedThumb) => {
      if (cancelled) return;
      setDisplaySrc((prev) => prev ?? resolvedThumb);
    });

    // Paso 2: Si el usuario entró al producto, cargar versión HD (1800px) en paralelo
    if (mode === 'detail-hd' && effectiveHd) {
      setIsHdLoaded(false);
      onHdReadyChange?.(false);
      void resolveImageById(imageId, 'hd', effectiveHd).then((resolvedHd) => {
        if (cancelled) return;
        const preload = new Image();
        preload.onload = () => {
          if (cancelled) return;
          setDisplaySrc(resolvedHd);
          setIsHdLoaded(true);
          onHdReadyChange?.(true);
        };
        preload.src = resolvedHd;
      });
    }

    return () => {
      cancelled = true;
    };
  }, [imageId, effectiveThumb, effectiveHd, mode, onHdReadyChange]);

  if (!effectiveThumb || failed) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center text-brand-300 gap-1">
        <Sparkles className="h-8 w-8" />
        <span className="text-xs font-semibold text-slate-400">
          {failed ? 'Imagen sin señal' : 'Imagen pendiente'}
        </span>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden">
      {!displaySrc && (
        <div
          aria-hidden="true"
          className="absolute inset-0 animate-pulse bg-gradient-to-r from-brand-50 via-white to-sky-50"
        />
      )}
      {displaySrc && (
        <img
          src={displaySrc}
          alt={alt}
          loading={mode === 'thumb' ? 'lazy' : 'eager'}
          decoding="async"
          onError={() => setFailed(true)}
          className={`${className} transition-opacity duration-200 ${
            isHdLoaded || mode === 'thumb' ? 'opacity-100' : 'opacity-95'
          }`}
        />
      )}
    </div>
  );
}
