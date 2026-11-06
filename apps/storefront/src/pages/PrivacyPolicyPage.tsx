import React from 'react';
import { BRAND_IDENTITY } from '@pequemodas/config';
import { Card } from '@pequemodas/ui';
import { useStorefront } from '../context/StorefrontContext';
import { usePageMeta } from '../hooks/usePageMeta';

export function PrivacyPolicyPage() {
  const { settings } = useStorefront();
  const storeName = settings?.commercial_name || BRAND_IDENTITY.commercialName;
  usePageMeta('Política de Privacidad', `Protección de datos personales en ${storeName}.`);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900">
        Política de Privacidad
      </h1>

      <Card padding="lg" className="space-y-4 text-sm sm:text-base text-slate-700 leading-relaxed">
        <section className="space-y-1.5">
          <h2 className="font-heading text-lg font-bold text-slate-900">
            1. Responsable y finalidad
          </h2>
          <p>
            <strong>{storeName}</strong> recopila únicamente la información mínima indispensable
            (nombre, vía de contacto y dirección o referencia en caso de entrega a domicilio) cuando
            decides enviar una solicitud de pedido por WhatsApp.
          </p>
        </section>

        <section className="space-y-1.5">
          <h2 className="font-heading text-lg font-bold text-slate-900">
            2. Sin pagos online ni datos bancarios
          </h2>
          <p>
            Esta plataforma nunca solicita, procesa ni almacena números de tarjetas bancarias,
            claves financieras ni credenciales de pago electrónico.
          </p>
        </section>

        <section className="space-y-1.5">
          <h2 className="font-heading text-lg font-bold text-slate-900">
            3. Almacenamiento local del carrito
          </h2>
          <p>
            Los artículos que añades al carrito se guardan localmente en tu propio dispositivo para
            facilitar tu navegación y puedes vaciarlos en cualquier momento.
          </p>
        </section>

        <section className="space-y-1.5">
          <h2 className="font-heading text-lg font-bold text-slate-900">
            4. Derechos del usuario
          </h2>
          <p>
            Puedes solicitar la actualización o eliminación de cualquier registro asociado a tu
            solicitud de pedido comunicándote por los canales oficiales publicados en la sección de
            Contacto.
          </p>
        </section>
      </Card>
    </div>
  );
}
