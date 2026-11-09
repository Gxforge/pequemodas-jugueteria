import React, { useState } from 'react';
import { CheckCircle2, MessageCircle, ShoppingBag } from 'lucide-react';
import {
  getStoredCustomerIdentity,
  isChatSupabaseConfigured,
  submitDirectAppOrder
} from '@pequemodas/shared';
import { Alert, Button, Card, Input, Select, Textarea } from '@pequemodas/ui';
import {
  getCurrencyTotal,
  normalizeCurrencyCode,
  type CurrencyTotal
} from '@pequemodas/utils';
import { CurrencyTotals } from './CurrencyTotals';
import type { CartItem } from '../context/CartContext';
import { useStorefront } from '../context/StorefrontContext';

export interface DirectAppCheckoutCardProps {
  items: CartItem[];
  totalsByCurrency: CurrencyTotal[];
  onOrderCompleted: () => void;
}

export function DirectAppCheckoutCard({
  items,
  totalsByCurrency,
  onOrderCompleted
}: DirectAppCheckoutCardProps) {
  const { settings } = useStorefront();
  const savedCustomer = getStoredCustomerIdentity();
  const configured = isChatSupabaseConfigured();

  const deliveryOptions = [
    ...(settings?.delivery_enabled !== false
      ? [{ value: 'delivery', label: 'Entrega a domicilio' }]
      : []),
    ...(settings?.pickup_enabled !== false
      ? [{ value: 'pickup', label: 'Recogida en tienda / punto acordado' }]
      : [])
  ];

  const [deliveryMode, setDeliveryMode] = useState<'delivery' | 'pickup'>(
    deliveryOptions[0]?.value === 'pickup' ? 'pickup' : 'delivery'
  );
  const [fullName, setFullName] = useState(savedCustomer?.fullName ?? '');
  const [phone, setPhone] = useState(savedCustomer?.phone ?? '');
  const [address, setAddress] = useState(savedCustomer?.address ?? '');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [createdRef, setCreatedRef] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (fullName.trim().length < 2) {
      setErrorMsg('Por favor escribe tu nombre completo.');
      return;
    }
    if (phone.trim().length < 6) {
      setErrorMsg('Por favor indica tu número de teléfono para contactarte.');
      return;
    }
    if (deliveryMode === 'delivery' && address.trim().length < 4) {
      setErrorMsg('Indica tu municipio, calle o referencia de entrega.');
      return;
    }

    setSubmitting(true);
    try {
      const result = await submitDirectAppOrder({
        fullName,
        phone,
        deliveryMode,
        deliveryAddress: address,
        deliveryNotes: notes,
        estimatedTotalCup: getCurrencyTotal(totalsByCurrency, 'CUP'),
        items: items.map((i) => ({
          product_id: i.productId,
          variant_id: i.variantId,
          product_name: i.productName,
          variant_name: i.variantName,
          attributes: i.attributes,
          quantity: i.quantity,
          unit_price_cup: i.unitPriceCup,
          currency_code: normalizeCurrencyCode(i.currencyCode)
        }))
      });
      setCreatedRef(result.referenceCode);
      onOrderCompleted();
      window.dispatchEvent(new CustomEvent('pequemodas:open-chat'));
    } catch (err) {
      setErrorMsg(
        err instanceof Error ? err.message : 'No se pudo registrar tu pedido en la app.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (createdRef) {
    return (
      <Card padding="lg" className="space-y-4 border-emerald-200 bg-emerald-50/40">
        <div className="flex items-center gap-2.5 text-emerald-700">
          <CheckCircle2 className="h-6 w-6 shrink-0" />
          <h2 className="font-heading text-lg font-extrabold">
            ¡Solicitud #{createdRef} enviada!
          </h2>
        </div>
        <p className="text-sm text-slate-700 leading-relaxed">
          Ya abrimos tu chat directo con la tienda. Katia revisará disponibilidad real y
          confirmará contigo la entrega sin cobros automáticos.
        </p>
        <Button
          fullWidth
          leftIcon={<MessageCircle className="h-4 w-4" />}
          onClick={() => window.dispatchEvent(new CustomEvent('pequemodas:open-chat'))}
        >
          Ver mi conversación en vivo
        </Button>
      </Card>
    );
  }

  return (
    <Card padding="lg" className="space-y-4">
      <div className="space-y-1">
        <h2 className="font-heading text-xl font-extrabold text-slate-900">
          Comprar directo desde la App
        </h2>
        <p className="text-xs text-slate-600">
          Deja tus datos aquí mismo y coordina en nuestro chat integrado sin salir de la aplicación.
        </p>
      </div>

      <div className="rounded-2xl bg-brand-50/70 border border-brand-100 p-3.5 flex items-center justify-between">
        <span className="text-sm font-semibold text-slate-700">Total estimado:</span>
        <CurrencyTotals totals={totalsByCurrency} size="sm" showNote />
      </div>

      <Alert variant="info" title="Confirmación directa en la tienda">
        Tu pedido llega al panel de Katia al instante junto con tu chat directo. El stock se
        confirma contigo personalmente antes de cerrar la compra.
      </Alert>

      {!configured && (
        <Alert variant="warning">
          El canal directo está sincronizándose. También puedes usar la pestaña de WhatsApp.
        </Alert>
      )}

      {errorMsg && <Alert variant="error">{errorMsg}</Alert>}

      <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
        {deliveryOptions.length > 0 && (
          <Select
            label="¿Cómo prefieres recibir tu pedido?"
            options={deliveryOptions}
            value={deliveryMode}
            onChange={(e) => setDeliveryMode(e.target.value as 'delivery' | 'pickup')}
          />
        )}

        <Input
          label="Tu nombre y apellido"
          requiredMark
          placeholder="Ej. Claudia Rodríguez"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />

        <Input
          label="Teléfono móvil de contacto"
          requiredMark
          placeholder="Ej. +53 5xxxxxxx"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        {deliveryMode === 'delivery' && (
          <Textarea
            label="Dirección, municipio o punto de referencia"
            requiredMark
            rows={2}
            placeholder="Calle, entre calles, reparto o municipio..."
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        )}

        <Textarea
          label="Nota para Katia (opcional)"
          rows={2}
          placeholder="Horario preferido, consulta de talla o regalo..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />

        <Button
          type="submit"
          size="lg"
          fullWidth
          disabled={!configured}
          isLoading={submitting}
          leftIcon={<ShoppingBag className="h-5 w-5" />}
        >
          Enviar compra y abrir chat en la App
        </Button>
      </form>
    </Card>
  );
}
