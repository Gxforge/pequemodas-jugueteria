import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FolderTree, MessageCircle } from 'lucide-react';
import { BRAND_IDENTITY } from '@pequemodas/config';
import { fetchProductsPaginated } from '@pequemodas/shared';
import { Button, EmptyState } from '@pequemodas/ui';
import { buildProductInquiryUrl, isValidWhatsAppPhone } from '@pequemodas/utils';
import { CategoryShowcaseCard } from '../components/CategoryShowcaseCard';
import { useStorefront } from '../context/StorefrontContext';
import { usePageMeta } from '../hooks/usePageMeta';
import { readOfflineSnapshot } from '../pwa/offlineSnapshot';

export function CategoriesIndexPage() {
  usePageMeta(
    'Categorías',
    'Explora las secciones visuales de ropa infantil, calzado y juguetes en PequeModas-Juguetería.'
  );
  const { categoryTree, settings, configured } = useStorefront();
  const storeName = settings?.commercial_name || BRAND_IDENTITY.commercialName;
  const whatsappHref =
    isValidWhatsAppPhone(settings?.whatsapp_phone) && settings?.whatsapp_phone
      ? buildProductInquiryUrl(settings.whatsapp_phone, storeName)
      : null;

  const { data: sampleProducts } = useQuery({
    queryKey: ['public-categories-showcase-products'],
    queryFn: () =>
      fetchProductsPaginated({
        publicationStatus: 'published',
        sort: 'newest',
        page: 1,
        pageSize: 36
      }),
    placeholderData: () => readOfflineSnapshot()?.catalogFirstPage,
    enabled: configured
  });

  const allProducts = sampleProducts?.items ?? [];

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900">
          Explora Nuestras Secciones
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Elige una colección para descubrir conjuntos infantiles, calzado y juguetes disponibles.
        </p>
      </div>

      {categoryTree.length === 0 ? (
        <EmptyState
          icon={<FolderTree className="h-8 w-8" />}
          title="Secciones en preparación"
          description="Pronto verás nuestras colecciones organizadas aquí. Mientras tanto puedes revisar el catálogo o consultar directamente."
          primaryAction={
            <Link to="/catalogo">
              <Button>Ir al catálogo</Button>
            </Link>
          }
          secondaryAction={
            whatsappHref ? (
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
                <Button variant="whatsapp" leftIcon={<MessageCircle className="h-4 w-4" />}>
                  Escribir por WhatsApp
                </Button>
              </a>
            ) : undefined
          }
        />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {categoryTree.map((cat) => (
            <CategoryShowcaseCard
              key={cat.id}
              category={cat}
              products={allProducts}
            />
          ))}
        </div>
      )}
    </div>
  );
}
