import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { MessageCircle } from 'lucide-react';
import { BRAND_IDENTITY } from '@pequemodas/config';
import { whatsappCheckoutSchema, type WhatsAppCheckoutInput } from '@pequemodas/schemas';
import { submitWhatsAppOrderRequest } from '@pequemodas/shared';
import { Alert, Button, Card, Input, Select, Textarea } from '@pequemodas/ui';
import {
  buildWhatsAppOrderMessage,
  buildWhatsAppUrl,
  formatCup,
  isValidWhatsAppPhone
} from '@pequemodas/utils';
import type { CartItem } from '../context/CartContext';
import { useStorefront } from '../context/StorefrontContext';

export function WhatsAppCheckoutCard({
  items,
  estimatedTotalCup
}: {
  items: CartItem[];
  estimatedTotalCup: number;
}) {
  const { settings } = useStorefront();
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [lastUrl, setLastUrl] = useState<string | null>(null);

  const storeName = settings?.commercial_name || BRAND_IDENTITY.commercialName;
  const whatsappPhone = settings?.whatsapp_phone ?? '';
  const hasPhone = isValidWhatsAppPhone(whatsappPhone);

  const deliveryOptions = [
    ...(settings?.delivery_enabled !== false
      ? [{ value: 'delivery', label: 'Entrega a domicilio' }]
      : []),
    ...(settings?.pickup_enabled !== false ? [{ value: 'pickup', label: 'Recogida' }] : [])
  ];

  const form = useForm<WhatsAppCheckoutInput>({
    resolver: zodResolver(whatsappCheckoutSchema),
    defaultValues: {
      deliveryMode: deliveryOptions[0]?.value === 'pickup' ? 'pickup' : 'delivery',
      customerName: '',
      customerPhone: '',
      deliveryAddress: '',
      deliveryNotes: ''
    }
  });

  const selectedMode = form.watch('deliveryMode');

  const onSubmit = async (values: WhatsAppCheckoutInput) => {
    setSubmitError(null);
    if (!hasPhone) {
      setSubmitError(
        'La tienda aún no ha configurado el número de WhatsApp para recibir pedidos.'
      );
      return;
    }

    const lineInputs = items.map((i) => ({
      productName: i.productName,
      variantLabel: i.variantName,
      attributesSummary: Object.entries(i.attributes)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', '),
      quantity: i.quantity,
      unitPriceCup: i.unitPriceCup
    }));

    const draftMessage = buildWhatsAppOrderMessage({
      storeName,
      whatsappPhone,
      items: lineInputs,
      deliveryMode: values.deliveryMode,
      customerName: values.customerName,
      customerPhone: values.customerPhone,
      deliveryAddress: values.deliveryAddress,
      deliveryNotes: values.deliveryNotes,
      configuredDeliveryInfo: settings?.delivery_info,
      configuredPickupInfo: settings?.pickup_info
    });

    let referenceCode: string | null = null;
    if (settings?.record_whatsapp_requests) {
      const res = await submitWhatsAppOrderRequest({
        deliveryMode: values.deliveryMode,
        customerName: values.customerName,
        customerPhone: values.customerPhone,
        deliveryAddress: values.deliveryAddress,
        deliveryNotes: values.deliveryNotes,
        whatsappMessage: draftMessage,
        items: items.map((i) => ({
          product_id: i.productId,
          variant_id: i.variantId,
          product_name: i.productName,
          variant_name: i.variantName,
          attributes: i.attributes,
          quantity: i.quantity,
          unit_price_cup: i.unitPriceCup
        }))
      });
      referenceCode = res.referenceCode;
    }

    const finalMessage = referenceCode
      ? buildWhatsAppOrderMessage({
          storeName,
          whatsappPhone,
          items: lineInputs,
          deliveryMode: values.deliveryMode,
          customerName: values.customerName,
          customerPhone: values.customerPhone,
          deliveryAddress: values.deliveryAddress,
          deliveryNotes: values.deliveryNotes,
          configuredDeliveryInfo: settings?.delivery_info,
          configuredPickupInfo: settings?.pickup_info,
          requestReference: referenceCode
        })
      : draftMessage;

    const waUrl = buildWhatsAppUrl(whatsappPhone, finalMessage);
    setLastUrl(waUrl);
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <Card padding="lg" className="space-y-4">
      <h2 className="font-heading text-xl font-extrabold text-slate-900">
        Solicitar Pedido por WhatsApp
      </h2>

      <div className="rounded-2xl bg-brand-50/70 border border-brand-100 p-3.5 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700">Total estimado en productos:</span>
        <span className="font-heading text-xl font-extrabold text-brand-600">
          {formatCup(estimatedTotalCup)}
        </span>
      </div>

      <Alert variant="info" title="Confirmación personal por WhatsApp">
        Abrir WhatsApp envía el resumen de tu solicitud. No se realizan cobros online ni se
        descuenta o reserva inventario automáticamente hasta que Katia confirme contigo.
      </Alert>

      {!hasPhone && (
        <Alert variant="warning">
          El número de WhatsApp de la tienda está pendiente de configuración administrativa.
        </Alert>
      )}

      {submitError && <Alert variant="error">{submitError}</Alert>}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {deliveryOptions.length > 0 && (
          <Select
            label="Modalidad de entrega o recogida"
            options={deliveryOptions}
            {...form.register('deliveryMode')}
          />
        )}

        {selectedMode === 'delivery' && settings?.delivery_info && (
          <p className="text-xs text-slate-600 bg-slate-50 rounded-xl p-3">
            <strong>Condiciones de entrega:</strong> {settings.delivery_info}
          </p>
        )}
        {selectedMode === 'pickup' && settings?.pickup_info && (
          <p className="text-xs text-slate-600 bg-slate-50 rounded-xl p-3">
            <strong>Información de recogida:</strong> {settings.pickup_info}
          </p>
        )}

        <Input
          label="Tu nombre"
          requiredMark
          placeholder="Ej. María Pérez"
          error={form.formState.errors.customerName?.message}
          {...form.register('customerName')}
        />

        <Input
          label="Teléfono de contacto (opcional)"
          placeholder="Ej. +535xxxxxxx"
          {...form.register('customerPhone')}
        />

        {selectedMode === 'delivery' && (
          <Textarea
            label="Dirección o referencia de entrega"
            requiredMark
            rows={2}
            placeholder="Municipio, calle, entre calles o referencia..."
            error={form.formState.errors.deliveryAddress?.message}
            {...form.register('deliveryAddress')}
          />
        )}

        <Textarea
          label="Notas adicionales (opcional)"
          rows={2}
          placeholder="Horario preferido o dudas sobre tallas..."
          {...form.register('deliveryNotes')}
        />

        <Button
          type="submit"
          variant="whatsapp"
          size="lg"
          fullWidth
          disabled={!hasPhone}
          isLoading={form.formState.isSubmitting}
          leftIcon={<MessageCircle className="h-5 w-5" />}
        >
          Abrir WhatsApp con mi pedido
        </Button>

        {lastUrl && (
          <p className="text-center text-xs text-slate-500">
            ¿No se abrió WhatsApp automáticamente?{' '}
            <a
              href={lastUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-whatsapp-600 underline"
            >
              Pulsa aquí para abrir el mensaje
            </a>
            .
          </p>
        )}
      </form>
    </Card>
  );
}
