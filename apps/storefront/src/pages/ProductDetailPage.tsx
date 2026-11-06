import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Check, MessageCircle, Minus, Plus, ShoppingBag } from 'lucide-react';
import { BRAND_IDENTITY } from '@pequemodas/config';
import {
  fetchProductBySlug,
  fetchRelatedProducts,
  getPrimaryProductImage,
  resolveProductAvailability,
  resolveVariantAvailability
} from '@pequemodas/shared';
import {
  Alert,
  AvailabilityBadge,
  Badge,
  Button,
  Card,
  EmptyState,
  Skeleton
} from '@pequemodas/ui';
import { buildProductInquiryUrl, formatCup, isValidWhatsAppPhone } from '@pequemodas/utils';
import { ProductCard } from '../components/ProductCard';
import { ProductImageGallery } from '../components/ProductImageGallery';
import { useCart } from '../context/CartContext';
import { useStorefront } from '../context/StorefrontContext';
import { usePageMeta } from '../hooks/usePageMeta';

export function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { configured, settings } = useStorefront();
  const { addItem } = useCart();

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [addedFeedback, setAddedFeedback] = useState(false);

  const { data: product, isLoading } = useQuery({
    queryKey: ['public-product-detail', slug],
    queryFn: () => (slug ? fetchProductBySlug(slug) : Promise.resolve(null)),
    enabled: configured && Boolean(slug)
  });

  const activeVariants = (product?.variants ?? []).filter((v) => v.is_active);
  const firstActiveVariantId = activeVariants[0]?.id ?? null;

  useEffect(() => {
    setQuantity(1);
    setSelectedVariantId(firstActiveVariantId);
  }, [product?.id, firstActiveVariantId]);

  usePageMeta(product?.name ?? 'Detalle del producto', product?.description ?? undefined);

  const { data: related = [] } = useQuery({
    queryKey: ['public-related-products', product?.id, product?.category_id],
    queryFn: () =>
      product ? fetchRelatedProducts(product.id, product.category_id) : Promise.resolve([]),
    enabled: configured && Boolean(product)
  });

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 grid md:grid-cols-2 gap-8">
        <Skeleton className="aspect-square w-full" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-28 w-full" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        <EmptyState
          title="Producto no disponible"
          description="Este artículo no existe o no se encuentra publicado actualmente."
          primaryAction={
            <Link to="/catalogo">
              <Button>Volver al catálogo</Button>
            </Link>
          }
        />
      </div>
    );
  }

  const selectedVariant =
    activeVariants.find((v) => v.id === selectedVariantId) ?? activeVariants[0] ?? null;
  const resolved = selectedVariant
    ? resolveVariantAvailability(product, selectedVariant)
    : resolveProductAvailability(product);

  const { thumbUrl } = getPrimaryProductImage(product);
  const storeName = settings?.commercial_name || BRAND_IDENTITY.commercialName;
  const inquiryHref =
    isValidWhatsAppPhone(settings?.whatsapp_phone) && settings?.whatsapp_phone
      ? buildProductInquiryUrl(settings.whatsapp_phone, storeName, product.name)
      : null;

  const handleAddToCart = () => {
    if (!resolved.canAddToCart) return;
    addItem({
      productId: product.id,
      productSlug: product.slug,
      productName: product.name,
      variantId: selectedVariant?.id ?? null,
      variantName: selectedVariant?.name ?? null,
      attributes: selectedVariant?.attributes ?? {},
      unitPriceCup: resolved.unitPriceCup,
      quantity,
      maxQuantity: resolved.availableQuantity,
      thumbnailUrl: thumbUrl
    });
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 2200);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-10">
      <Link
        to="/catalogo"
        className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-brand-600"
      >
        <ArrowLeft className="h-4 w-4" /> Volver al catálogo
      </Link>

      <div className="grid md:grid-cols-2 gap-6 lg:gap-10 items-start">
        <ProductImageGallery images={product.images ?? []} productName={product.name} />

        <Card padding="lg" className="space-y-5">
          <div className="space-y-2">
            {product.category && (
              <Link to={`/categorias/${product.category.slug}`}>
                <Badge tone="sky">{product.category.name}</Badge>
              </Link>
            )}
            <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900">
              {product.name}
            </h1>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <span className="font-heading text-2xl sm:text-3xl font-extrabold text-brand-600">
                {formatCup(resolved.unitPriceCup)}
              </span>
              <AvailabilityBadge
                status={resolved.status}
                quantity={resolved.availableQuantity}
              />
            </div>
          </div>

          {product.description && (
            <p className="text-sm sm:text-base text-slate-600 whitespace-pre-line leading-relaxed">
              {product.description}
            </p>
          )}

          {activeVariants.length > 0 && (
            <div className="space-y-2.5">
              <p className="text-sm font-bold text-slate-800">Selecciona una variante:</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {activeVariants.map((variant) => {
                  const vRes = resolveVariantAvailability(product, variant);
                  const isSelected = selectedVariant?.id === variant.id;
                  const attrText = Object.entries(variant.attributes)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(' · ');

                  return (
                    <button
                      key={variant.id}
                      type="button"
                      onClick={() => {
                        setSelectedVariantId(variant.id);
                        setQuantity(1);
                      }}
                      className={`text-left rounded-2xl border p-3 transition-all ${
                        isSelected
                          ? 'border-brand-600 bg-brand-50/70 ring-1 ring-brand-500'
                          : 'border-slate-200 hover:border-brand-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-sm text-slate-900">{variant.name}</span>
                        <span className="text-xs font-extrabold text-brand-600">
                          {formatCup(vRes.unitPriceCup)}
                        </span>
                      </div>
                      {attrText && <p className="text-xs text-slate-500 mt-0.5">{attrText}</p>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {resolved.canAddToCart ? (
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-slate-800">Cantidad:</span>
                <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50">
                  <button
                    type="button"
                    aria-label="Reducir cantidad"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="p-2.5 text-slate-700 hover:text-brand-600"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="px-4 font-bold text-slate-900">{quantity}</span>
                  <button
                    type="button"
                    aria-label="Aumentar cantidad"
                    onClick={() =>
                      setQuantity((q) =>
                        resolved.availableQuantity !== null
                          ? Math.min(resolved.availableQuantity, q + 1)
                          : q + 1
                      )
                    }
                    className="p-2.5 text-slate-700 hover:text-brand-600"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <Button
                size="lg"
                fullWidth
                leftIcon={
                  addedFeedback ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <ShoppingBag className="h-5 w-5" />
                  )
                }
                onClick={handleAddToCart}
              >
                {addedFeedback ? '¡Añadido al carrito!' : 'Añadir al carrito'}
              </Button>
            </div>
          ) : (
            <Alert variant="warning" title="Producto temporalmente agotado">
              Puedes consultar próximas entradas directamente por WhatsApp.
            </Alert>
          )}

          {inquiryHref && (
            <a href={inquiryHref} target="_blank" rel="noopener noreferrer" className="block">
              <Button
                variant="whatsapp"
                fullWidth
                leftIcon={<MessageCircle className="h-4 w-4" />}
              >
                Consultar este producto por WhatsApp
              </Button>
            </a>
          )}
        </Card>
      </div>

      {related.length > 0 && (
        <section className="space-y-4 pt-4">
          <h2 className="font-heading text-xl font-extrabold text-slate-900">
            Productos Relacionados
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
