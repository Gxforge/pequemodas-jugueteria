import React, { useState } from 'react';
import type { ProductImageRow } from '@pequemodas/shared';

export function ProductImageGallery({
  images,
  productName
}: {
  images: ProductImageRow[];
  productName: string;
}) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const activeImg = images[selectedIdx] ?? images[0] ?? null;

  return (
    <div className="space-y-3">
      <div className="aspect-square rounded-3xl bg-white border border-slate-100 shadow-card overflow-hidden flex items-center justify-center">
        {activeImg ? (
          <img
            src={activeImg.public_url}
            alt={activeImg.alt_text ?? productName}
            className="h-full w-full object-contain"
          />
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
              className={`aspect-square rounded-xl overflow-hidden border-2 ${
                idx === selectedIdx ? 'border-brand-600' : 'border-transparent'
              }`}
            >
              <img
                src={img.thumbnail_url ?? img.public_url}
                alt={`${productName} vista ${idx + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
