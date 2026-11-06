import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MessageCircle } from 'lucide-react';
import { BRAND_IDENTITY } from '@pequemodas/config';
import {
  fetchProductsPaginated,
  resolveProductAvailability,
  type ProductSortOption
} from '@pequemodas/shared';
import {
  Button,
  Card,
  EmptyState,
  Input,
  ProductCardSkeleton,
  Select
} from '@pequemodas/ui';
import { buildProductInquiryUrl, isValidWhatsAppPhone } from '@pequemodas/utils';
import { ProductCard } from '../components/ProductCard';
import { useStorefront } from '../context/StorefrontContext';
import { usePageMeta } from '../hooks/usePageMeta';
import {
  readOfflineSnapshot,
  writeOfflineSnapshotPatch
} from '../pwa/offlineSnapshot';

export function CatalogPage() {
  usePageMeta('Catálogo', 'Explora todo el catálogo de juguetes y ropa infantil en CUP.');
  const { configured, categories, settings } = useStorefront();

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
    placeholderData: () =>
      isDefaultView ? readOfflineSnapshot()?.catalogFirstPage : undefined,
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
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900">
          Catálogo de Productos
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Filtra por categoría, ordena por precio en CUP y revisa disponibilidad actualizada.
        </p>
      </div>

      <Card className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <Input
            placeholder="Buscar juguete o prenda..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
          <Select
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              setSubcategoryId('');
              setPage(1);
            }}
            options={[
              { value: '', label: 'Todas las categorías' },
              ...rootCategories.map((c) => ({ value: c.id, label: c.name }))
            ]}
          />
          <Select
            value={subcategoryId}
            disabled={subcategories.length === 0}
            onChange={(e) => {
              setSubcategoryId(e.target.value);
              setPage(1);
            }}
            options={[
              { value: '', label: 'Todas las subcategorías' },
              ...subcategories.map((s) => ({ value: s.id, label: s.name }))
            ]}
          />
          <Select
            value={sort}
            onChange={(e) => setSort(e.target.value as ProductSortOption)}
            options={[
              { value: 'newest', label: 'Más recientes' },
              { value: 'price_asc', label: 'Precio: menor a mayor' },
              { value: 'price_desc', label: 'Precio: mayor a menor' },
              { value: 'name_asc', label: 'Nombre: A - Z' }
            ]}
          />
        </div>
        <label className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-700">
          <input
            type="checkbox"
            checked={onlyAvailable}
            onChange={(e) => setOnlyAvailable(e.target.checked)}
            className="h-4 w-4 rounded"
          />
          Mostrar únicamente productos disponibles para añadir al carrito
        </label>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : visibleItems.length === 0 ? (
        <EmptyState
          title="No encontramos productos para mostrar"
          description="El catálogo puede estar actualizándose o no hay coincidencias con los filtros elegidos. Visita nuestras categorías o consúltanos directamente por WhatsApp."
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
                Limpiar filtros
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
            Página {data.page} de {data.totalPages}
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
