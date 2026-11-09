import React from 'react';
import { Link } from 'react-router-dom';
import { Archive, Copy, Edit2, Eye, EyeOff, Trash2 } from 'lucide-react';
import type { PublicationStatus } from '@pequemodas/schemas';
import {
  getPrimaryProductImage,
  resolveProductAvailability,
  type ProductDetailDto
} from '@pequemodas/shared';
import { AvailabilityBadge, Badge, Button, Card } from '@pequemodas/ui';
import { formatMoney } from '@pequemodas/utils';

export function AdminProductCard({
  product,
  onStatusChange,
  onDuplicate,
  onDelete
}: {
  product: ProductDetailDto;
  onStatusChange: (product: ProductDetailDto, status: PublicationStatus) => void;
  onDuplicate: (product: ProductDetailDto) => void;
  onDelete: (product: ProductDetailDto) => void;
}) {
  const avail = resolveProductAvailability(product);
  const { thumbUrl } = getPrimaryProductImage(product);

  return (
    <Card padding="sm" className="flex flex-col justify-between gap-3">
      <div className="space-y-2.5">
        <div className="aspect-[4/3] rounded-xl bg-slate-100 overflow-hidden relative">
          {thumbUrl ? (
            <img
              src={thumbUrl}
              alt={product.name}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center text-xs text-slate-400">
              Sin foto
            </div>
          )}
          <div className="absolute top-2 left-2">
            <Badge
              tone={
                product.publication_status === 'published'
                  ? 'success'
                  : product.publication_status === 'archived'
                    ? 'danger'
                    : 'neutral'
              }
            >
              {product.publication_status === 'published'
                ? 'Publicado'
                : product.publication_status === 'draft'
                  ? 'Borrador'
                  : product.publication_status === 'hidden'
                    ? 'Oculto'
                    : 'Archivado'}
            </Badge>
          </div>
        </div>

        <div>
          <h3 className="font-heading font-bold text-slate-900 line-clamp-1">
            {product.name}
          </h3>
          <p className="text-base font-extrabold text-brand-600 mt-0.5">
            {formatMoney(avail.unitPriceCup, avail.currencyCode)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <AvailabilityBadge status={avail.status} quantity={avail.availableQuantity} />
          {product.variants.length > 0 && (
            <Badge tone="sky">{product.variants.length} variantes</Badge>
          )}
        </div>
      </div>

      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-1">
        <Link to={`/productos/${product.id}`}>
          <Button size="sm" variant="outline" leftIcon={<Edit2 className="h-3.5 w-3.5" />}>
            Editar
          </Button>
        </Link>
        <div className="flex items-center gap-1">
          {product.publication_status === 'published' ? (
            <Button
              size="sm"
              variant="ghost"
              title="Ocultar"
              onClick={() => onStatusChange(product, 'hidden')}
            >
              <EyeOff className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              title="Publicar"
              onClick={() => onStatusChange(product, 'published')}
            >
              <Eye className="h-4 w-4 text-emerald-600" />
            </Button>
          )}
          <Button size="sm" variant="ghost" title="Duplicar" onClick={() => onDuplicate(product)}>
            <Copy className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            title="Archivar"
            onClick={() => onStatusChange(product, 'archived')}
          >
            <Archive className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" title="Eliminar" onClick={() => onDelete(product)}>
            <Trash2 className="h-4 w-4 text-rose-600" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
