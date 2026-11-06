import React, { useState } from 'react';
import { Sparkles, X, ZoomIn } from 'lucide-react';
import type { ProductImageRow } from '@pequemodas/shared';
import { SmartProductImage } from './SmartProductImage';

export function ProductImageGallery({
  images,
  productName
}: {
  images: ProductImageRow[];
  productName: string;
}) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [hdReady, setHdReady] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);
  const activeImg = images[selectedIdx] ?? images[0] ?? null;

  return (
    <div className="space-y-3">
      <div className="relative aspect-square rounded-3xl bg-white border border-slate-100 shadow-card overflow-hidden flex items-center justify-center group">
        {activeImg ? (
          <>
            <button
              type="button"
              onClick={() => setZoomOpen(true)}
              aria-label={`Ampliar imagen en alta resolución de ${productName}`}
              className="h-full w-full cursor-zoom-in focus:outline-none"
            >
              <SmartProductImage
                key={activeImg.id}
                imageId={activeImg.id}
                thumbUrl={activeImg.thumbnail_url ?? activeImg.public_url}
                fullUrl={activeImg.public_url}
                alt={activeImg.alt_text ?? productName}
                mode="detail-hd"
                onHdReadyChange={setHdReady}
                className="h-full w-full object-contain"
              />
            </button>

            <div className="pointer-events-none absolute bottom-3 right-3 flex items-center gap-1.5">
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold shadow-sm backdrop-blur ${
                  hdReady
                    ? 'bg-emerald-600/90 text-white'
                    : 'bg-white/90 text-slate-700 border border-slate-200'
                }`}
              >
                <Sparkles className="h-3 w-3" />
                {hdReady ? 'HD Nítida' : 'Cargando HD...'}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/75 text-white px-2.5 py-1 text-[11px] font-semibold backdrop-blur">
                <ZoomIn className="h-3 w-3" />
                Ampliar
              </span>
            </div>
          </>
        ) : (
          <span className="text-sm text-slate-400">Sin fotografía cargada</span>
        )}
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {images.map((img, idx) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setSelectedIdx(idx)}
              className={`aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                idx === selectedIdx
                  ? 'border-brand-600 ring-2 ring-brand-200'
                  : 'border-transparent opacity-80 hover:opacity-100'
              }`}
            >
              <SmartProductImage
                imageId={img.id}
                thumbUrl={img.thumbnail_url ?? img.public_url}
                fullUrl={img.public_url}
                alt={`${productName} vista ${idx + 1}`}
                mode="thumb"
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Visor Pantalla Completa en Alta Resolución */}
      {zoomOpen && activeImg && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Vista en alta resolución de ${productName}`}
          onClick={() => setZoomOpen(false)}
          className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-sm p-4 flex items-center justify-center"
        >
          <button
            type="button"
            onClick={() => setZoomOpen(false)}
            aria-label="Cerrar vista ampliada"
            className="absolute top-4 right-4 rounded-full bg-white/15 hover:bg-white/25 text-white p-2.5"
          >
            <X className="h-6 w-6" />
          </button>
          <div
            onClick={(e) => e.stopPropagation()}
            className="max-w-4xl max-h-[88vh] w-full h-full flex items-center justify-center"
          >
            <SmartProductImage
              imageId={activeImg.id}
              thumbUrl={activeImg.thumbnail_url ?? activeImg.public_url}
              fullUrl={activeImg.public_url}
              alt={activeImg.alt_text ?? productName}
              mode="detail-hd"
              className="max-h-[86vh] w-full object-contain rounded-2xl"
            />
          </div>
        </div>
      )}
    </div>
  );
}
