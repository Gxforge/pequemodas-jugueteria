import React from 'react';
import { Clock, ExternalLink, MessageCircle, Phone } from 'lucide-react';
import { BRAND_IDENTITY } from '@pequemodas/config';
import { Alert, Button, Card } from '@pequemodas/ui';
import { buildProductInquiryUrl, isValidWhatsAppPhone } from '@pequemodas/utils';
import { useStorefront } from '../context/StorefrontContext';
import { usePageMeta } from '../hooks/usePageMeta';

export function ContactPage() {
  const { settings } = useStorefront();
  const storeName = settings?.commercial_name || BRAND_IDENTITY.commercialName;
  usePageMeta('Contacto', `Comunícate con ${storeName} por WhatsApp o redes sociales.`);

  const hasWhatsApp = isValidWhatsAppPhone(settings?.whatsapp_phone);
  const waHref =
    hasWhatsApp && settings?.whatsapp_phone
      ? buildProductInquiryUrl(settings.whatsapp_phone, storeName)
      : null;

  const socials = [
    { label: 'Instagram', url: settings?.social_links?.instagram },
    { label: 'Facebook', url: settings?.social_links?.facebook },
    { label: 'Grupo / Canal de WhatsApp', url: settings?.social_links?.whatsappGroup },
    { label: 'Telegram', url: settings?.social_links?.telegram }
  ].filter((s) => Boolean(s.url));

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="space-y-2">
        <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900">
          Contacto Directo
        </h1>
        <p className="text-sm sm:text-base text-slate-600">
          Estamos encantados de ayudarte con dudas sobre tallas, edades recomendadas o disponibilidad.
        </p>
      </div>

      {!waHref && !settings?.phone && (
        <Alert variant="info" title="Canales de contacto en actualización">
          La administración de la tienda publicará aquí los números de atención próximamente.
        </Alert>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <Card className="space-y-3">
          <h2 className="font-heading text-lg font-bold text-slate-900 flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-whatsapp-600" />
            Atención por WhatsApp
          </h2>
          <p className="text-sm text-slate-600">
            Canal principal para consultas rápidas y confirmación manual de tus pedidos.
          </p>
          {waHref ? (
            <a href={waHref} target="_blank" rel="noopener noreferrer" className="block pt-1">
              <Button variant="whatsapp" fullWidth leftIcon={<MessageCircle className="h-4 w-4" />}>
                Escribir por WhatsApp
              </Button>
            </a>
          ) : (
            <p className="text-xs text-slate-400">Número pendiente de configurar.</p>
          )}
        </Card>

        <Card className="space-y-3">
          <h2 className="font-heading text-lg font-bold text-slate-900 flex items-center gap-2">
            <Phone className="h-5 w-5 text-brand-600" />
            Teléfono y Horarios
          </h2>
          <p className="text-sm text-slate-700">
            <strong>Teléfono:</strong> {settings?.phone || 'No especificado'}
          </p>
          <p className="text-sm text-slate-700 flex items-start gap-1.5">
            <Clock className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
            <span>{settings?.business_hours || 'Horario sujeto a coordinación previa.'}</span>
          </p>
        </Card>
      </div>

      {socials.length > 0 && (
        <Card className="space-y-3">
          <h2 className="font-heading text-lg font-bold text-slate-900">Redes Sociales</h2>
          <div className="flex flex-wrap gap-3">
            {socials.map((s) => (
              <a
                key={s.label}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-brand-300 hover:text-brand-600"
              >
                <span>{s.label}</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
