import { formatCup, roundMoney } from './currency';

export type DeliveryMode = 'delivery' | 'pickup';

export interface WhatsAppOrderLineInput {
  productName: string;
  variantLabel?: string | null;
  attributesSummary?: string | null;
  quantity: number;
  unitPriceCup: number;
}

export interface WhatsAppOrderPayload {
  storeName: string;
  whatsappPhone: string;
  items: WhatsAppOrderLineInput[];
  deliveryMode: DeliveryMode;
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  deliveryNotes?: string;
  configuredDeliveryInfo?: string | null;
  configuredPickupInfo?: string | null;
  requestReference?: string | null;
}

export function normalizeWhatsAppDigits(rawPhone: string): string {
  return rawPhone.replace(/[^\d]/g, '');
}

export function isValidWhatsAppPhone(rawPhone: string | null | undefined): boolean {
  if (!rawPhone) return false;
  const digits = normalizeWhatsAppDigits(rawPhone);
  return digits.length >= 8 && digits.length <= 15;
}

export function buildWhatsAppOrderMessage(payload: WhatsAppOrderPayload): string {
  const lines: string[] = [];
  lines.push(`Hola *${payload.storeName}*, deseo solicitar el siguiente pedido:`);
  if (payload.requestReference) {
    lines.push(`Referencia de solicitud: #${payload.requestReference}`);
  }
  lines.push('');
  lines.push('*Resumen de productos:*');

  let estimatedTotal = 0;
  payload.items.forEach((item, index) => {
    const lineSubtotal = roundMoney(item.unitPriceCup * item.quantity);
    estimatedTotal = roundMoney(estimatedTotal + lineSubtotal);
    const variantPart = item.variantLabel ? ` (${item.variantLabel})` : '';
    const attrsPart = item.attributesSummary ? ` [${item.attributesSummary}]` : '';
    lines.push(
      `${index + 1}. *${item.productName}*${variantPart}${attrsPart}`
    );
    lines.push(
      `   Cantidad: ${item.quantity} × ${formatCup(item.unitPriceCup)} = *${formatCup(lineSubtotal)}*`
    );
  });

  lines.push('');
  lines.push(`*Total estimado en productos:* ${formatCup(estimatedTotal)}`);
  lines.push(
    `*Modalidad solicitada:* ${
      payload.deliveryMode === 'delivery' ? 'Entrega a domicilio' : 'Recogida'
    }`
  );

  if (payload.customerName?.trim()) {
    lines.push(`*Cliente:* ${payload.customerName.trim()}`);
  }
  if (payload.customerPhone?.trim()) {
    lines.push(`*Teléfono de contacto:* ${payload.customerPhone.trim()}`);
  }
  if (payload.deliveryMode === 'delivery' && payload.deliveryAddress?.trim()) {
    lines.push(`*Dirección / referencia:* ${payload.deliveryAddress.trim()}`);
  }
  if (payload.deliveryNotes?.trim()) {
    lines.push(`*Notas:* ${payload.deliveryNotes.trim()}`);
  }

  lines.push('');
  if (payload.deliveryMode === 'delivery' && payload.configuredDeliveryInfo?.trim()) {
    lines.push(`Condiciones de entrega informadas: ${payload.configuredDeliveryInfo.trim()}`);
  } else if (payload.deliveryMode === 'pickup' && payload.configuredPickupInfo?.trim()) {
    lines.push(`Información de recogida: ${payload.configuredPickupInfo.trim()}`);
  }
  lines.push(
    'Quedo pendiente de su confirmación manual de disponibilidad y tarifa final. ¡Gracias!'
  );

  return lines.join('\n');
}

export function buildWhatsAppUrl(rawPhone: string, message: string): string {
  const digits = normalizeWhatsAppDigits(rawPhone);
  if (!digits) {
    throw new Error('El número de WhatsApp de la tienda aún no está configurado.');
  }
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function buildProductInquiryUrl(
  rawPhone: string,
  storeName: string,
  productName?: string
): string {
  const text = productName
    ? `Hola ${storeName}, me gustaría consultar la disponibilidad de: *${productName}*.`
    : `Hola ${storeName}, me gustaría consultar información sobre sus productos disponibles.`;
  return buildWhatsAppUrl(rawPhone, text);
}
