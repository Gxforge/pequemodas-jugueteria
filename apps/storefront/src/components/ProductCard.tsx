import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import {
  getPrimaryProductImage,
  resolveProductAvailability,
  type ProductDetailDto
} from '@pequemodas/shared';
import { AvailabilityBadge, Badge, Card } from '@pequemodas/ui';
import { formatCup } from '@pequemodas/utils';

export function ProductCard({ product }: { product: ProductDetailDto }) {
  const avail = resolveProductAvailability(product);
  const { thumbUrl } = getPrimaryProductImage(product);
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <Link to={`/producto/${product.slug}`} className="block group focus:outline-none">
      <Card
        padding="sm"
        interactive
        className="h-full flex flex-col justify-between gap-3 group-focus-visible:ring-2 group-focus-visible:ring-brand-500"
      >
        <div className="space-y-2.5">
          <div className="aspect-square rounded-xl bg-gradient-to-br from-brand-50 to-sky-50 overflow-hidden relative">
            {thumbUrl && !failed ? (
              <>
                {!loaded && (
                  <div
                    aria-hidden="true"
                    className="absolute inset-0 animate-pulse bg-gradient-to-r from-brand-50 via-white to-sky-50"
                  />
                )}
                <img
                  src={thumbUrl}
                  alt={product.name}
                  loading="lazy"
                  decoding="async"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  onLoad={() => setLoaded(true)}
                  onError={() => setFailed(true)}
                  className={`h-full w-full object-cover transition-all duration-300 group-hover:scale-105 ${
                    loaded ? 'opacity-100' : 'opacity-0'
                  }`}
                />
              </>
            ) : (
              <div className="h-full w-full flex flex-col items-center justify-center text-brand-300 gap-1">
                <Sparkles className="h-8 w-8" />
                <span className="text-xs font-semibold text-slate-400">
                  {failed ? 'Imagen sin señal' : 'Imagen pendiente'}
                </span>
              </div>
            )}
            {product.is_featured && (
              <div className="absolute top-2 left-2">
                <Badge tone="sunny">Destacado</Badge>
              </div>
            )}
          </div>

          {product.category && (
            <p className="text-xs font-semibold text-sky-600 truncate">
              {product.category.name}
              {product.subcategory ? ` · ${product.subcategory.name}` : ''}
            </p>
          )}

          <h3 className="font-heading font-bold text-slate-900 line-clamp-2 text-sm sm:text-base">
            {product.name}
          </h3>
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
          <div>
            {product.variants.length > 0 && (
              <span className="block text-[11px] text-slate-400">Desde</span>
            )}
            <span className="font-heading text-base sm:text-lg font-extrabold text-brand-600">
              {formatCup(avail.unitPriceCup)}
            </span>
          </div>
          <AvailabilityBadge status={avail.status} />
        </div>
      </Card>
    </Link>
  );
}
