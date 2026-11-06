import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import type { PublicationStatus } from '@pequemodas/schemas';
import {
  deleteProductPermanently,
  duplicateProduct,
  fetchCategories,
  fetchProductsPaginated,
  setProductPublicationStatus,
  type ProductDetailDto,
  type ProductSortOption
} from '@pequemodas/shared';
import {
  Alert,
  Button,
  Card,
  EmptyState,
  Input,
  ProductCardSkeleton,
  Select
} from '@pequemodas/ui';
import { AdminProductCard } from '../components/AdminProductCard';
import { useAuth } from '../context/AuthContext';

export function ProductsListPage() {
  const { store } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<PublicationStatus | 'all'>('all');
  const [categoryId, setCategoryId] = useState('');
  const [sort, setSort] = useState<ProductSortOption>('newest');
  const [page, setPage] = useState(1);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data: categories = [] } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => fetchCategories({ includeArchived: false })
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-products', { search, status, categoryId, sort, page }],
    queryFn: () =>
      fetchProductsPaginated({
        search,
        publicationStatus: status,
        categoryId: categoryId || undefined,
        sort,
        page,
        pageSize: 12
      })
  });

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    void queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
  };

  const handleToggleStatus = async (p: ProductDetailDto, next: PublicationStatus) => {
    if (!store) return;
    try {
      await setProductPublicationStatus(p.id, store.id, next);
      refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Error al actualizar estado.');
    }
  };

  const handleDuplicate = async (p: ProductDetailDto) => {
    if (!store) return;
    try {
      await duplicateProduct(p.id, store.id);
      refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Error al duplicar.');
    }
  };

  const handleDelete = async (p: ProductDetailDto) => {
    if (!store) return;
    if (!window.confirm(`¿Eliminar permanentemente "${p.name}" y sus fotografías?`)) return;
    try {
      await deleteProductPermanently(p.id, store.id);
      refresh();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Error al eliminar.');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-slate-900">Productos</h1>
          <p className="text-sm text-slate-600">
            Crea, publica, oculta o duplica productos rápidamente.
          </p>
        </div>
        <Link to="/productos/nuevo">
          <Button leftIcon={<Plus className="h-4 w-4" />}>Crear producto</Button>
        </Link>
      </div>

      {actionError && <Alert variant="error">{actionError}</Alert>}

      <Card className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <Input
          placeholder="Buscar por nombre..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <Select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value as PublicationStatus | 'all');
            setPage(1);
          }}
          options={[
            { value: 'all', label: 'Todos los estados' },
            { value: 'published', label: 'Publicados' },
            { value: 'draft', label: 'Borradores' },
            { value: 'hidden', label: 'Ocultos' },
            { value: 'archived', label: 'Archivados' }
          ]}
        />
        <Select
          value={categoryId}
          onChange={(e) => {
            setCategoryId(e.target.value);
            setPage(1);
          }}
          options={[
            { value: '', label: 'Todas las categorías' },
            ...categories
              .filter((c) => c.parent_id === null)
              .map((c) => ({ value: c.id, label: c.name }))
          ]}
        />
        <Select
          value={sort}
          onChange={(e) => setSort(e.target.value as ProductSortOption)}
          options={[
            { value: 'newest', label: 'Más recientes' },
            { value: 'price_asc', label: 'Menor precio' },
            { value: 'price_desc', label: 'Mayor precio' },
            { value: 'name_asc', label: 'Nombre A-Z' }
          ]}
        />
      </Card>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          title="No hay productos en esta vista"
          description="El catálogo comienza vacío. Pulsa «Crear producto» para subir tu primer artículo con sus fotografías y precio en CUP."
          primaryAction={
            <Link to="/productos/nuevo">
              <Button>Crear primer producto</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.items.map((product) => (
            <AdminProductCard
              key={product.id}
              product={product}
              onStatusChange={(p, next) => void handleToggleStatus(p, next)}
              onDuplicate={(p) => void handleDuplicate(p)}
              onDelete={(p) => void handleDelete(p)}
            />
          ))}
        </div>
      )}

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            size="sm"
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Anterior
          </Button>
          <span className="text-sm font-semibold text-slate-600">
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
