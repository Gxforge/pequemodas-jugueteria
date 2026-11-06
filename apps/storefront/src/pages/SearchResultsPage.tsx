import React, { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  BookOpen,
  FolderTree,
  MessageCircle,
  Search,
  ShoppingBag,
  Sparkles
} from 'lucide-react';
import { BRAND_IDENTITY } from '@pequemodas/config';
import {
  fetchProductsPaginated,
  type PaginatedProductsResult
} from '@pequemodas/shared';
import { Button, Card, EmptyState, ProductCardSkeleton } from '@pequemodas/ui';
import {
  buildProductInquiryUrl,
  detectStoreSearchIntent,
  formatCup,
  isValidWhatsAppPhone,
  scoreSmartTextMatch
} from '@pequemodas/utils';
import { ProductCard } from '../components/ProductCard';
import { SmartSearchBox } from '../components/SmartSearchBox';
import { useCart } from '../context/CartContext';
import { useStorefront } from '../context/StorefrontContext';
import { usePageMeta } from '../hooks/usePageMeta';

export function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQ = searchParams.get('q') ?? '';
  const [term, setTerm] = useState(initialQ);
  const { configured, settings, categoryTree, catalogItems } = useStorefront();
  const { totalQuantity, estimatedTotalCup } = useCart();

  useEffect(() => {
    setTerm(initialQ);
  }, [initialQ]);

  usePageMeta(initialQ ? `Buscar: ${initialQ}` : 'Buscar productos');

  const intent = useMemo(() => detectStoreSearchIntent(initialQ), [initialQ]);

  const instantSearchSeed = useMemo<PaginatedProductsResult | undefined>(() => {
    if (!initialQ.trim() || catalogItems.length === 0) return undefined;
    const matched = catalogItems.filter(
      (p) =>
        scoreSmartTextMatch(initialQ, [
          p.name,
          p.description ?? '',
          p.category?.name ?? ''
        ]) > 0
    );
    return {
      items: matched.slice(0, 20),
      total: matched.length,
      page: 1,
      pageSize: 20,
      totalPages: 1
    };
  }, [initialQ, catalogItems]);

  const { data, isLoading } = useQuery({
    queryKey: ['public-search', initialQ],
    queryFn: () =>
      fetchProductsPaginated({
        publicationStatus: 'published',
        search: initialQ,
        page: 1,
        pageSize: 20
      }),
    placeholderData: instantSearchSeed,
    enabled: configured && initialQ.trim().length > 0
  });

  const storeName = settings?.commercial_name || BRAND_IDENTITY.commercialName;
  const inquiryHref =
    isValidWhatsAppPhone(settings?.whatsapp_phone) && settings?.whatsapp_phone
      ? buildProductInquiryUrl(settings.whatsapp_phone, storeName, initialQ || undefined)
      : null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-5">
      <div className="max-w-2xl mx-auto space-y-3">
        <SmartSearchBox
          value={term}
          onChange={setTerm}
          onSubmitSearch={(val) => setSearchParams(val.trim() ? { q: val.trim() } : {})}
          placeholder="Escribe prenda, juguete (aunque tenga faltas) o 'mi carrito'..."
          autoFocusInput={!initialQ}
        />

        {/* Accesos rápidos de 1 toque desde el buscador móvil */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <Link
            to="/catalogo"
            className="inline-flex items-center gap-1 rounded-full bg-white border border-brand-200 px-3 py-1.5 font-bold text-brand-700 hover:bg-brand-50"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Todo el catálogo</span>
          </Link>
          <Link
            to="/carrito"
            className="inline-flex items-center gap-1 rounded-full bg-white border border-slate-200 px-3 py-1.5 font-bold text-slate-700 hover:border-brand-300"
          >
            <ShoppingBag className="h-3.5 w-3.5 text-brand-600" />
            <span>
              Mi carrito{totalQuantity > 0 ? ` (${totalQuantity})` : ''}
            </span>
          </Link>
          <Link
            to="/informacion-pedidos"
            className="inline-flex items-center gap-1 rounded-full bg-white border border-slate-200 px-3 py-1.5 font-bold text-slate-700 hover:border-sky-300"
          >
            <BookOpen className="h-3.5 w-3.5 text-sky-600" />
            <span>Cómo pedir</span>
          </Link>
          {categoryTree.slice(0, 4).map((cat) => (
            <Link
              key={cat.id}
              to={`/categorias/${cat.slug}`}
              className="inline-flex items-center gap-1 rounded-full bg-sky-50/90 border border-sky-200 px-3 py-1.5 font-bold text-sky-800 hover:bg-sky-100"
            >
              <FolderTree className="h-3.5 w-3.5" />
              <span>{cat.name}</span>
            </Link>
          ))}
        </div>
      </div>

      {intent && (
        <Card className="bg-gradient-to-r from-brand-50 via-white to-sky-50 border-brand-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="h-11 w-11 rounded-2xl bg-brand-600 text-white flex items-center justify-center shrink-0">
              <ShoppingBag className="h-5 w-5" />
            </span>
            <div>
              <p className="font-heading font-extrabold text-slate-900">
                {intent.kind === 'cart'
                  ? totalQuantity > 0
                    ? `Tienes ${totalQuantity} artículo(s) en tu carrito (${formatCup(estimatedTotalCup)})`
                    : 'Tu carrito está listo para llenarse'
                  : intent.title}
              </p>
              <p className="text-xs text-slate-600">{intent.subtitle}</p>
            </div>
          </div>
          {intent.href ? (
            <Link to={intent.href}>
              <Button size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>
                {intent.actionLabel}
              </Button>
            </Link>
          ) : (
            <Button
              size="sm"
              onClick={() => window.dispatchEvent(new CustomEvent('pequemodas:open-chat'))}
            >
              {intent.actionLabel}
            </Button>
          )}
        </Card>
      )}

      {data?.didYouMean && (
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 border border-amber-200 px-3.5 py-1.5 text-xs font-bold text-amber-950">
          <Sparkles className="h-3.5 w-3.5 text-amber-600" />
          <span>
            Corrección inteligente aplicada para{' '}
            <button
              type="button"
              onClick={() => setSearchParams({ q: data.didYouMean! })}
              className="underline text-brand-700"
            >
              «{data.didYouMean}»
            </button>
          </span>
        </div>
      )}

      {!initialQ.trim() ? (
        catalogItems.length > 0 ? (
          <div className="space-y-4">
            <p className="text-sm font-bold text-slate-700">
              Artículos recientes listos para explorar
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {catalogItems.slice(0, 8).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        ) : (
          <EmptyState
            icon={<Search className="h-8 w-8" />}
            title="Buscador Inteligente PequeModas"
            description="Puedes escribir aunque falte alguna tilde o letra, o escribir 'mi carrito' o 'cómo pedir'."
            primaryAction={
              <Link to="/catalogo">
                <Button variant="outline">Ver catálogo completo</Button>
              </Link>
            }
          />
        )
      ) : isLoading && !data ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          title={`No hay artículos todavía para «${data?.didYouMean || initialQ}»`}
          description="Consúltanos directamente en el chat o por WhatsApp y Katia te confirma si está por entrar."
          primaryAction={
            inquiryHref ? (
              <a href={inquiryHref} target="_blank" rel="noopener noreferrer">
                <Button variant="whatsapp" leftIcon={<MessageCircle className="h-4 w-4" />}>
                  Preguntar en WhatsApp
                </Button>
              </a>
            ) : (
              <Button
                onClick={() =>
                  window.dispatchEvent(new CustomEvent('pequemodas:open-chat'))
                }
              >
                Preguntar en el chat
              </Button>
            )
          }
        />
      ) : (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-slate-600">
            {data.total} artículo(s) encontrado(s)
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {data.items.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
