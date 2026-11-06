import React from 'react';
import { Clock, MapPin, Store, Truck } from 'lucide-react';
import { BRAND_IDENTITY } from '@pequemodas/config';
import { Card } from '@pequemodas/ui';
import { useStorefront } from '../context/StorefrontContext';
import { usePageMeta } from '../hooks/usePageMeta';

export function StoreInfoPage() {
  const { settings } = useStorefront();
  const storeName = settings?.commercial_name || BRAND_IDENTITY.commercialName;
  usePageMeta('Información de la Tienda', `Conoce ${storeName}, horarios y modalidades de entrega.`);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="space-y-2">
        <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900">
          Sobre {storeName}
        </h1>
        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
          {settings?.description ||
            'Tienda especializada en artículos infantiles: juguetes, ropa y accesorios seleccionados con dedicación para niños y familias.'}
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Card className="space-y-2">
          <div className="flex items-center gap-2 text-brand-600 font-bold">
            <Clock className="h-5 w-5" />
            <h2>Horarios de Atención</h2>
          </div>
          <p className="text-sm text-slate-600 whitespace-pre-line">
            {settings?.business_hours ||
              'Horario comercial pendiente de publicación. Puedes escribirnos por WhatsApp en cualquier momento.'}
          </p>
        </Card>

        <Card className="space-y-2">
          <div className="flex items-center gap-2 text-sky-600 font-bold">
            <MapPin className="h-5 w-5" />
            <h2>Ubicación</h2>
          </div>
          <p className="text-sm text-slate-600 whitespace-pre-line">
            {settings?.address ||
              'La dirección exacta o punto de recogida se facilita directamente al confirmar tu pedido.'}
          </p>
        </Card>

        <Card className="space-y-2">
          <div className="flex items-center gap-2 text-emerald-600 font-bold">
            <Truck className="h-5 w-5" />
            <h2>Entrega a Domicilio</h2>
          </div>
          <p className="text-sm text-slate-600 whitespace-pre-line">
            {settings?.delivery_enabled === false
              ? 'Actualmente la entrega a domicilio no está habilitada.'
              : settings?.delivery_info ||
                'Las zonas y tarifas de mensajería se coordinan personalmente con Katia por WhatsApp.'}
          </p>
        </Card>

        <Card className="space-y-2">
          <div className="flex items-center gap-2 text-amber-600 font-bold">
            <Store className="h-5 w-5" />
            <h2>Recogida</h2>
          </div>
          <p className="text-sm text-slate-600 whitespace-pre-line">
            {settings?.pickup_enabled === false
              ? 'Actualmente la modalidad de recogida no está habilitada.'
              : settings?.pickup_info ||
                'Puedes solicitar recogida previa coordinación de horario por WhatsApp.'}
          </p>
        </Card>
      </div>
    </div>
  );
}
