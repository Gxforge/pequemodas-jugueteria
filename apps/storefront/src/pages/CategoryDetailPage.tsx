import React, { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight } from 'lucide-react';
import { fetchProductsPaginated } from '@pequemodas/shared';
import { Badge, Button, EmptyState, ProductCardSkeleton } from '@pequemodas/ui';
import { ProductCard } from '../components/ProductCard';
import { useStorefront } from '../context/StorefrontContext';
import { usePageMeta } from '../hooks/usePageMeta';

export function CategoryDetailPage() {
  const { categorySlug, subcategorySlug } = useParams<{
    categorySlug: string;
    subcategorySlug?: string;
  }>();
  const { configured, categoryTree } = useStorefront();
  const [page, setPage] = useState(1);

  const currentCategory = categoryTree.find((c) => c.slug === categorySlug) ?? null;
  const currentSubcategory =
    currentCategory?.subcategories.find((s) => s.slug === subcategorySlug) ?? null;

  usePageMeta(
    currentSubcategory
      ? `${currentSubcategory.name} — ${currentCategory?.name ?? ''}`
      : currentCategory?.name ?? 'Categoría'
  );

  const { data, isLoading } = useQuery({
    queryKey: [
      'public-category-products',
      currentCategory?.id,
      currentSubcategory?.id,
      page
    ],
    queryFn: () =>
      fetchProductsPaginated({
        publicationStatus: 'published',
        categoryId: currentCategory?.id,
        subcategoryId: currentSubcategory?.id,
        page,
        pageSize: 12
      }),
    enabled: configured && Boolean(currentCategory)
  });

  if (!currentCategory) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-10">
        <EmptyState
          title="Categoría no encontrada"
          description="La sección solicitada no existe o aún no tiene artículos activos."
          primaryAction={
            <Link to="/categorias">
              <Button>Ver todas las categorías</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      <nav aria-label="Ruta de navegación" className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-500">
        <Link to="/categorias" className="hover:text-brand-600">
          Categorías
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link to={`/categorias/${currentCategory.slug}`} className="font-semibold text-slate-800">
          {currentCategory.name}
        </Link>
        {currentSubcategory && (
          <>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="font-semibold text-brand-600">{currentSubcategory.name}</span>
          </>
        )}
      </nav>

      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900">
          {currentSubcategory ? currentSubcategory.name : currentCategory.name}
        </h1>
        {(currentSubcategory?.description ?? currentCategory.description) && (
          <p className="text-sm text-slate-600 mt-1">
            {currentSubcategory?.description ?? currentCategory.description}
          </p>
        )}
      </div>

      {currentCategory.subcategories.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Link to={`/categorias/${currentCategory.slug}`}>
            <Badge tone={!currentSubcategory ? 'brand' : 'neutral'}>Todas</Badge>
          </Link>
          {currentCategory.subcategories.map((sub) => (
            <Link key={sub.id} to={`/categorias/${currentCategory.slug}/${sub.slug}`}>
              <Badge tone={currentSubcategory?.id === sub.id ? 'brand' : 'sky'}>
                {sub.name}
              </Badge>
            </Link>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          title="Sin productos publicados en esta sección"
          description="Pronto añadiremos artículos aquí. Puedes explorar el resto del catálogo."
          primaryAction={
            <Link to="/catalogo">
              <Button variant="outline">Ir al catálogo general</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {data.items.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-4">
          <Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
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
