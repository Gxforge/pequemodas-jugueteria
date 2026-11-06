import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MessageCircle, ShieldCheck, Sparkles, Truck } from 'lucide-react';
import { BRAND_IDENTITY } from '@pequemodas/config';
import {
  AnimatedBrandCloudsLogo,
  Badge,
  Button,
  Card,
  EmptyState,
  ProductCardSkeleton
} from '@pequemodas/ui';
import { buildProductInquiryUrl, isValidWhatsAppPhone } from '@pequemodas/utils';
import { CategoryShowcaseCard } from '../components/CategoryShowcaseCard';
import { ProductCard } from '../components/ProductCard';
import { useStorefront } from '../context/StorefrontContext';
import { usePageMeta } from '../hooks/usePageMeta';

export function HomePage() {
  const { settings, categoryTree, catalogItems, isCatalogInitialLoading } =
    useStorefront();
  const storeName = settings?.commercial_name || BRAND_IDENTITY.commercialName;
  usePageMeta('Inicio', `Descubre ropa infantil, juguetes y accesorios en ${storeName}.`);

  const hasWhatsApp = isValidWhatsAppPhone(settings?.whatsapp_phone);
  const inquiryHref =
    hasWhatsApp && settings?.whatsapp_phone
      ? buildProductInquiryUrl(settings.whatsapp_phone, storeName)
      : null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-10 space-y-10">
      {/* Hero Comercial Alegre y Confiable con Logo + Nubes Animadas por Detrás */}
      <section className="rounded-3xl bg-gradient-to-br from-brand-50 via-white to-sky-50 border border-brand-100 p-6 sm:p-10 shadow-card overflow-hidden">
        <div className="grid lg:grid-cols-12 gap-6 lg:gap-8 items-center">
          <div className="lg:col-span-6 order-2 lg:order-1 space-y-4">
            <Badge tone="brand">Catálogo Infantil Actualizado en CUP</Badge>
            <h1 className="font-heading text-3xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
              Todo para consentir y vestir a tus pequeños en{' '}
              <span className="text-brand-600">{storeName}</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
              {settings?.description ||
                'Explora juguetes, conjuntos infantiles y accesorios seleccionados. Elige tus variantes favoritas en el carrito y coordina tu pedido directamente por WhatsApp.'}
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link to="/catalogo">
                <Button size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
                  Ver catálogo
                </Button>
              </Link>
              <Link to="/informacion-pedidos">
                <Button size="lg" variant="outline">
                  ¿Cómo hacer un pedido?
                </Button>
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6 order-1 lg:order-2">
            <AnimatedBrandCloudsLogo
              logoUrl={settings?.logo_url}
              commercialName={storeName}
              className="max-w-lg mx-auto"
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4 mt-8 pt-6 border-t border-brand-100/70 text-xs sm:text-sm">
          <div className="flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-brand-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-900">Variantes claras</p>
              <p className="text-slate-600">Tallas, colores, edades y precios transparentes en CUP.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <MessageCircle className="h-5 w-5 text-whatsapp-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-900">Atención por WhatsApp</p>
              <p className="text-slate-600">Sin pagos online ni tarjetas; trato directo y humano.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Truck className="h-5 w-5 text-sky-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-900">Entrega o recogida</p>
              <p className="text-slate-600">Selecciona tu modalidad preferida al enviar tu solicitud.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categorías si existen */}
      {categoryTree.length > 0 && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-xl sm:text-2xl font-extrabold text-slate-900">
              Explora por Categorías
            </h2>
            <Link to="/categorias" className="text-sm font-bold text-brand-600 hover:underline">
              Ver todas
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryTree.slice(0, 6).map((cat) => (
              <CategoryShowcaseCard
                key={cat.id}
                category={cat}
                products={catalogItems}
                compact
              />
            ))}
          </div>
        </section>
      )}

      {/* Novedades del Catálogo con Texto Instantáneo y Fotos Progresivas */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-xl sm:text-2xl font-extrabold text-slate-900">
            Novedades en Tienda
          </h2>
          <Link to="/catalogo" className="text-sm font-bold text-brand-600 hover:underline">
            Ir al catálogo
          </Link>
        </div>

        {isCatalogInitialLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : catalogItems.length === 0 ? (
          <EmptyState
            title="¡Estamos preparando nuevas sorpresas para tus peques!"
            description="En este momento el catálogo público aún no tiene artículos publicados. Visita la sección de información de pedidos o escríbenos por WhatsApp para consultar novedades disponibles."
            primaryAction={
              inquiryHref ? (
                <a href={inquiryHref} target="_blank" rel="noopener noreferrer">
                  <Button
                    variant="whatsapp"
                    leftIcon={<MessageCircle className="h-4 w-4" />}
                  >
                    Consultar por WhatsApp
                  </Button>
                </a>
              ) : (
                <Link to="/informacion-pedidos">
                  <Button variant="secondary">Cómo realizar pedidos</Button>
                </Link>
              )
            }
            secondaryAction={
              <Link to="/tienda">
                <Button variant="outline">Conocer la tienda</Button>
              </Link>
            }
          />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {catalogItems.slice(0, 8).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      <Card className="bg-sky-50/70 border-sky-100 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-8 w-8 text-sky-600 shrink-0" />
          <div>
            <p className="font-heading font-bold text-slate-900">
              Compra segura y confirmada personalmente
            </p>
            <p className="text-xs sm:text-sm text-slate-600">
              Katia revisa y confirma la disponibilidad real de cada prenda o juguete contigo en WhatsApp.
            </p>
          </div>
        </div>
        <Link to="/contacto">
          <Button variant="secondary" size="sm">
            Ver datos de contacto
          </Button>
        </Link>
      </Card>
    </div>
  );
}
