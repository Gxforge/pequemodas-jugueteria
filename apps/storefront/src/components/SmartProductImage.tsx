import React, { useEffect, useRef, useState } from 'react';
import { ImageIcon, Loader2, RefreshCw, Sparkles } from 'lucide-react';
import {
  clearMemoryImageEntry,
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
 * Imagen Progresiva Optimizada para Conexiones Lentas:
 * - El texto, precio y botones de la tarjeta se muestran al instante (0 ms) sin esperar la foto.
 * - Mientras la foto descarga en segundo plano, muestra un shimmer suave con aviso claro
 *   «Cargando foto...» y transición limpia al terminar de decodificar.
 * - Si la señal cae, ofrece botón táctil «Cargar foto» sin bloquear abrir el producto.
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

  const ramInitial =
    mode === 'detail-hd'
      ? peekCachedImageInRam(imageId, 'hd') || peekCachedImageInRam(imageId, 'thumb')
      : peekCachedImageInRam(imageId, 'thumb');

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [shouldStart, setShouldStart] = useState<boolean>(
    () => mode === 'detail-hd' || Boolean(ramInitial)
  );
  const [displaySrc, setDisplaySrc] = useState<string | null>(ramInitial);
  const [imgDecoded, setImgDecoded] = useState<boolean>(() => Boolean(ramInitial));
  const [isHdLoaded, setIsHdLoaded] = useState<boolean>(() =>
    mode === 'detail-hd' ? Boolean(peekCachedImageInRam(imageId, 'hd')) : false
  );
  const [failed, setFailed] = useState(false);
  const [retryTick, setRetryTick] = useState(0);

  // Prioriza descargar solo las tarjetas cercanas a la vista actual del cliente
  useEffect(() => {
    if (shouldStart) return;
    const node = containerRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setShouldStart(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setShouldStart(true);
          observer.disconnect();
        }
      },
      { rootMargin: '240px 0px' }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [shouldStart]);

  useEffect(() => {
    let cancelled = false;
    setFailed(false);

    if (!effectiveThumb) {
      setDisplaySrc(null);
      setImgDecoded(false);
      return;
    }

    const ramHd = mode === 'detail-hd' ? peekCachedImageInRam(imageId, 'hd') : null;
    if (ramHd) {
      setDisplaySrc(ramHd);
      setImgDecoded(true);
      setIsHdLoaded(true);
      onHdReadyChange?.(true);
      return;
    }

    const ramThumb = peekCachedImageInRam(imageId, 'thumb');
    if (ramThumb) {
      setDisplaySrc(ramThumb);
      setImgDecoded(true);
    } else if (!shouldStart) {
      return;
    }

    // Paso 1: Miniatura ligera cacheada por UUID
    void resolveImageById(imageId, 'thumb', effectiveThumb).then((resolvedThumb) => {
      if (cancelled) return;
      const nextUrl = retryTick > 0 && resolvedThumb === effectiveThumb
        ? `${resolvedThumb}${resolvedThumb.includes('?') ? '&' : '?'}r=${retryTick}`
        : resolvedThumb;
      setDisplaySrc((prev) => prev ?? nextUrl);
    });

    // Paso 2: Alta definición solo dentro de la vista detalle
    if (mode === 'detail-hd' && effectiveHd) {
      setIsHdLoaded(false);
      onHdReadyChange?.(false);
      void resolveImageById(imageId, 'hd', effectiveHd).then((resolvedHd) => {
        if (cancelled) return;
        const preload = new Image();
        preload.onload = () => {
          if (cancelled) return;
          setDisplaySrc(resolvedHd);
          setImgDecoded(true);
          setIsHdLoaded(true);
          onHdReadyChange?.(true);
        };
        preload.src = resolvedHd;
      });
    }

    return () => {
      cancelled = true;
    };
  }, [imageId, effectiveThumb, effectiveHd, mode, shouldStart, retryTick, onHdReadyChange]);

  if (!effectiveThumb) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center text-brand-300 gap-1 p-3 text-center">
        <Sparkles className="h-7 w-7" />
        <span className="text-[11px] font-semibold text-slate-400">Foto próximamente</span>
      </div>
    );
  }

  if (failed) {
    return (
      <div className="h-full w-full flex flex-col items-center justify-center bg-slate-50/90 text-slate-500 gap-2 p-3 text-center">
        <ImageIcon className="h-6 w-6 text-brand-300" />
        <span className="text-[11px] font-semibold text-slate-500 leading-tight">
          Señal lenta en foto
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            clearMemoryImageEntry(imageId, 'thumb');
            setDisplaySrc(null);
            setImgDecoded(false);
            setFailed(false);
            setShouldStart(true);
            setRetryTick((n) => n + 1);
          }}
          className="inline-flex items-center gap-1 rounded-full bg-white border border-brand-200 px-2.5 py-1 text-[10.5px] font-extrabold text-brand-700 shadow-sm hover:bg-brand-50"
        >
          <RefreshCw className="h-3 w-3" />
          <span>Cargar foto</span>
        </button>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden">
      {!imgDecoded && (
        <div
          role="status"
          aria-label="Cargando imagen del producto"
          className="absolute inset-0 z-10 pm-img-shimmer flex flex-col items-center justify-center gap-1.5 p-2 text-center"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 backdrop-blur-sm border border-brand-100/90 px-2.5 py-1 shadow-sm">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-brand-600 shrink-0" />
            <span className="text-[10.5px] font-bold text-slate-600">
              Cargando foto...
            </span>
          </span>
        </div>
      )}

      {displaySrc && (
        <img
          src={displaySrc}
          alt={alt}
          loading={mode === 'thumb' ? 'lazy' : 'eager'}
          decoding="async"
          onLoad={() => setImgDecoded(true)}
          onError={() => setFailed(true)}
          className={`${className} transition-opacity duration-300 ${
            imgDecoded
              ? isHdLoaded || mode === 'thumb'
                ? 'opacity-100'
                : 'opacity-95'
              : 'opacity-0'
          }`}
        />
      )}
    </div>
  );
}
