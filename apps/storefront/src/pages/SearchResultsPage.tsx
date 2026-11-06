import React, { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { MessageCircle, Search } from 'lucide-react';
import { BRAND_IDENTITY } from '@pequemodas/config';
import { fetchProductsPaginated } from '@pequemodas/shared';
import { Button, Card, EmptyState, Input, ProductCardSkeleton } from '@pequemodas/ui';
import { buildProductInquiryUrl, isValidWhatsAppPhone } from '@pequemodas/utils';
import { ProductCard } from '../components/ProductCard';
import { useStorefront } from '../context/StorefrontContext';
import { usePageMeta } from '../hooks/usePageMeta';

export function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQ = searchParams.get('q') ?? '';
  const [term, setTerm] = useState(initialQ);
  const { configured, settings } = useStorefront();

  usePageMeta(initialQ ? `Buscar: ${initialQ}` : 'Buscar productos');

  const { data, isLoading } = useQuery({
    queryKey: ['public-search', initialQ],
    queryFn: () =>
      fetchProductsPaginated({
        publicationStatus: 'published',
        search: initialQ,
        page: 1,
        pageSize: 20
      }),
    enabled: configured && initialQ.trim().length > 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams(term.trim() ? { q: term.trim() } : {});
  };

  const storeName = settings?.commercial_name || BRAND_IDENTITY.commercialName;
  const inquiryHref =
    isValidWhatsAppPhone(settings?.whatsapp_phone) && settings?.whatsapp_phone
      ? buildProductInquiryUrl(settings.whatsapp_phone, storeName, initialQ || undefined)
      : null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      <Card>
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Escribe qué juguete, prenda o accesorio buscas..."
              aria-label="Término de búsqueda"
            />
          </div>
          <Button type="submit" leftIcon={<Search className="h-4 w-4" />}>
            Buscar
          </Button>
        </form>
      </Card>

      {!initialQ.trim() ? (
        <EmptyState
          icon={<Search className="h-8 w-8" />}
          title="Busca en PequeModas-Juguetería"
          description="Ingresa una palabra clave arriba o explora todas las categorías disponibles."
          primaryAction={
            <Link to="/catalogo">
              <Button variant="outline">Ver catálogo completo</Button>
            </Link>
          }
        />
      ) : isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : !data || data.items.length === 0 ? (
        <EmptyState
          title={`Sin resultados para "${initialQ}"`}
          description="Puede que recibamos ese artículo próximamente. Pregúntanos directamente por WhatsApp."
          primaryAction={
            inquiryHref ? (
              <a href={inquiryHref} target="_blank" rel="noopener noreferrer">
                <Button variant="whatsapp" leftIcon={<MessageCircle className="h-4 w-4" />}>
                  Preguntar por "{initialQ}" en WhatsApp
                </Button>
              </a>
            ) : (
              <Link to="/catalogo">
                <Button>Explorar catálogo</Button>
              </Link>
            )
          }
        />
      ) : (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-slate-600">
            {data.total} resultado(s) para «{initialQ}»
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
