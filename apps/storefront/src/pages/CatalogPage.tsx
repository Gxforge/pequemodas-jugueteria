import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MessageCircle, Sparkles } from 'lucide-react';
import { BRAND_IDENTITY } from '@pequemodas/config';
import {
  fetchProductsPaginated,
  resolveProductAvailability,
  type PaginatedProductsResult,
  type ProductSortOption
} from '@pequemodas/shared';
import { Button, EmptyState, ProductCardSkeleton } from '@pequemodas/ui';
import {
  buildProductInquiryUrl,
  isValidWhatsAppPhone,
  scoreSmartTextMatch
} from '@pequemodas/utils';
import { CatalogCompactToolbar } from '../components/CatalogCompactToolbar';
import { ProductCard } from '../components/ProductCard';
import { useStorefront } from '../context/StorefrontContext';
import { usePageMeta } from '../hooks/usePageMeta';
import { writeOfflineSnapshotPatch } from '../pwa/offlineSnapshot';

export function CatalogPage() {
  usePageMeta('Catálogo', 'Explora todo el catálogo de juguetes y ropa infantil en CUP.');
  const { configured, categories, settings, catalogPreview, catalogItems } =
    useStorefront();

  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [subcategoryId, setSubcategoryId] = useState('');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [sort, setSort] = useState<ProductSortOption>('newest');
  const [page, setPage] = useState(1);

  const rootCategories = categories.filter((c) => c.parent_id === null);
  const subcategories = categories.filter(
    (c) => categoryId && c.parent_id === categoryId
  );

  const isDefaultView =
    !search && !categoryId && !subcategoryId && sort === 'newest' && page === 1;

  // Respaldo instantáneo (0 ms) con tarjetas de texto desde memoria mientras llega la red lenta
  const instantSeed = useMemo<PaginatedProductsResult | undefined>(() => {
    if (isDefaultView && catalogPreview) return catalogPreview;
    if (page !== 1 || catalogItems.length === 0) return undefined;

    let list = [...catalogItems];
    if (categoryId) {
      list = list.filter(
        (p) => p.category_id === categoryId || p.subcategory_id === categoryId
      );
    }
    if (subcategoryId) {
      list = list.filter((p) => p.subcategory_id === subcategoryId);
    }
    if (search.trim()) {
      list = list.filter(
        (p) =>
          scoreSmartTextMatch(search, [
            p.name,
            p.description ?? '',
            p.category?.name ?? ''
          ]) > 0
      );
    }
    if (sort === 'price_asc') {
      list.sort((a, b) => a.base_price_cup - b.base_price_cup);
    } else if (sort === 'price_desc') {
      list.sort((a, b) => b.base_price_cup - a.base_price_cup);
    } else if (sort === 'name_asc') {
      list.sort((a, b) => a.name.localeCompare(b.name, 'es'));
    }

    return {
      items: list.slice(0, 12),
      total: list.length,
      page: 1,
      pageSize: 12,
      totalPages: Math.max(1, Math.ceil(list.length / 12))
    };
  }, [isDefaultView, catalogPreview, page, catalogItems, categoryId, subcategoryId, search, sort]);

  const { data, isLoading } = useQuery({
    queryKey: ['public-catalog', { search, categoryId, subcategoryId, sort, page }],
    queryFn: async () => {
      const res = await fetchProductsPaginated({
        publicationStatus: 'published',
        search,
        categoryId: categoryId || undefined,
        subcategoryId: subcategoryId || undefined,
        sort,
        page,
        pageSize: 12
      });
      if (isDefaultView) {
        writeOfflineSnapshotPatch({ catalogFirstPage: res });
      }
      return res;
    },
    placeholderData: instantSeed,
    enabled: configured
  });

  const visibleItems = (data?.items ?? []).filter((p) =>
    onlyAvailable ? resolveProductAvailability(p).canAddToCart : true
  );

  const storeName = settings?.commercial_name || BRAND_IDENTITY.commercialName;
  const whatsappHref =
    isValidWhatsAppPhone(settings?.whatsapp_phone) && settings?.whatsapp_phone
      ? buildProductInquiryUrl(settings.whatsapp_phone, storeName)
      : null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-5 sm:py-7 space-y-5">
      <CatalogCompactToolbar
        search={search}
        categoryId={categoryId}
        subcategoryId={subcategoryId}
        onlyAvailable={onlyAvailable}
        sort={sort}
        rootCategories={rootCategories}
        subcategories={subcategories}
        onSearchChange={(val) => {
          setSearch(val);
          setPage(1);
        }}
        onCategoryChange={(val) => {
          setCategoryId(val);
          setSubcategoryId('');
          setPage(1);
        }}
        onSubcategoryChange={(val) => {
          setSubcategoryId(val);
          setPage(1);
        }}
        onOnlyAvailableChange={setOnlyAvailable}
        onSortChange={setSort}
      />

      {data?.didYouMean && search.trim() && (
        <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1 text-xs font-bold text-amber-950">
          <Sparkles className="h-3.5 w-3.5 text-amber-600" />
          <span>Mostrando coincidencias para «{data.didYouMean}»</span>
        </div>
      )}

      {isLoading && !data ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : visibleItems.length === 0 ? (
        <EmptyState
          title="Todavía no hay artículos en esta vista"
          description="Explora nuestras colecciones o escríbenos en el chat para ayudarte al momento."
          primaryAction={
            whatsappHref ? (
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                <Button variant="whatsapp" leftIcon={<MessageCircle className="h-4 w-4" />}>
                  Consultar por WhatsApp
                </Button>
              </a>
            ) : (
              <Link to="/categorias">
                <Button variant="secondary">Ver categorías</Button>
              </Link>
            )
          }
          secondaryAction={
            (search || categoryId || onlyAvailable) && (
              <Button
                variant="outline"
                onClick={() => {
                  setSearch('');
                  setCategoryId('');
                  setSubcategoryId('');
                  setOnlyAvailable(false);
                }}
              >
                Ver todo
              </Button>
            )
          }
        />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {visibleItems.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-4">
          <Button
            size="sm"
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Anterior
          </Button>
          <span className="text-sm font-semibold text-slate-700">
            {data.page} / {data.totalPages}
          </span>
          <Button
            size="sm"
            variant="outline"
            disabled={page >= data.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Siguiente
          </Button>
        </div>
      )}
    </div>
  );
}
