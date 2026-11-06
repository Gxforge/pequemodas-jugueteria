import React from 'react';
import { Link } from 'react-router-dom';
import { FolderTree, MessageCircle } from 'lucide-react';
import { BRAND_IDENTITY } from '@pequemodas/config';
import { Badge, Button, Card, EmptyState } from '@pequemodas/ui';
import { buildProductInquiryUrl, isValidWhatsAppPhone } from '@pequemodas/utils';
import { useStorefront } from '../context/StorefrontContext';
import { usePageMeta } from '../hooks/usePageMeta';

export function CategoriesIndexPage() {
  usePageMeta('Categorías', 'Navega por las categorías y subcategorías de PequeModas-Juguetería.');
  const { categoryTree, settings } = useStorefront();
  const storeName = settings?.commercial_name || BRAND_IDENTITY.commercialName;
  const whatsappHref =
    isValidWhatsAppPhone(settings?.whatsapp_phone) && settings?.whatsapp_phone
      ? buildProductInquiryUrl(settings.whatsapp_phone, storeName)
      : null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      <div>
        <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900">
          Categorías y Subcategorías
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Encuentra rápidamente juguetes, conjuntos infantiles y accesorios por sección.
        </p>
      </div>

      {categoryTree.length === 0 ? (
        <EmptyState
          icon={<FolderTree className="h-8 w-8" />}
          title="Categorías en organización"
          description="Pronto verás las colecciones organizadas aquí. Mientras tanto puedes revisar el catálogo general o consultar por WhatsApp."
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
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categoryTree.map((cat) => (
            <Card key={cat.id} className="flex flex-col justify-between gap-4">
              <div className="space-y-2">
                <Link
                  to={`/categorias/${cat.slug}`}
                  className="font-heading text-lg font-extrabold text-slate-900 hover:text-brand-600"
                >
                  {cat.name}
                </Link>
                {cat.description && (
                  <p className="text-xs sm:text-sm text-slate-600">{cat.description}</p>
                )}
                {cat.subcategories.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {cat.subcategories.map((sub) => (
                      <Link key={sub.id} to={`/categorias/${cat.slug}/${sub.slug}`}>
                        <Badge tone="sky" className="hover:bg-sky-100">
                          {sub.name}
                        </Badge>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              <Link to={`/categorias/${cat.slug}`}>
                <Button size="sm" variant="outline" fullWidth>
                  Ver productos de {cat.name}
                </Button>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
