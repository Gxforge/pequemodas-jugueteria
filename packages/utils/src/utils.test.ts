import { describe, expect, it } from 'vitest';
import {
  buildProductInquiryUrl,
  buildWhatsAppOrderMessage,
  buildWhatsAppUrl,
  formatCup,
  isValidWhatsAppPhone,
  slugify,
  validateImageFile
} from './index';

describe('@pequemodas/utils', () => {
  it('formatea precios en CUP correctamente', () => {
    expect(formatCup(0)).toBe('0 CUP');
    expect(formatCup(1500)).toContain('CUP');
    expect(formatCup(1250.5)).toContain('50 CUP');
  });

  it('genera slugs limpios sin tildes ni caracteres especiales', () => {
    expect(slugify('Ropa de Niña y Bebé!')).toBe('ropa-de-nina-y-bebe');
    expect(slugify('  Juguetes   Educativos 2026 ')).toBe('juguetes-educativos-2026');
  });

  it('valida teléfonos de WhatsApp y codifica enlaces wa.me', () => {
    expect(isValidWhatsAppPhone('+53 5234 5678')).toBe(true);
    expect(isValidWhatsAppPhone('123')).toBe(false);
    expect(isValidWhatsAppPhone('')).toBe(false);

    const url = buildWhatsAppUrl('+53 5234 5678', 'Hola PequeModas');
    expect(url).toBe('https://wa.me/5352345678?text=Hola%20PequeModas');

    const inquiry = buildProductInquiryUrl('+5352345678', 'PequeModas-Juguetería', 'Muñeca');
    expect(inquiry).toContain('wa.me/5352345678');
    expect(decodeURIComponent(inquiry)).toContain('Muñeca');
  });

  it('construye mensaje completo de pedido por WhatsApp con variantes, subtotales y modalidad', () => {
    const msg = buildWhatsAppOrderMessage({
      storeName: 'PequeModas-Juguetería',
      whatsappPhone: '+5352345678',
      deliveryMode: 'delivery',
      customerName: 'Elena Gómez',
      deliveryAddress: 'Calle 23 #456, Vedado',
      requestReference: 'PM-A1B2C3',
      items: [
        {
          productName: 'Vestido Algodón',
          variantLabel: 'Talla 4 - Coral',
          attributesSummary: 'Talla: 4 años, Color: Coral',
          quantity: 2,
          unitPriceCup: 1800
        }
      ]
    });

    expect(msg).toContain('PequeModas-Juguetería');
    expect(msg).toContain('#PM-A1B2C3');
    expect(msg).toContain('Vestido Algodón');
    expect(msg).toContain('Talla 4 - Coral');
    expect(msg).toContain('Entrega a domicilio');
    expect(msg).toContain('Elena Gómez');
    expect(msg).toContain('confirmación manual');
  });

  it('valida tipos MIME y tamaño máximo de fotografías antes de subir a Storage', () => {
    expect(
      validateImageFile({ name: 'foto.webp', type: 'image/webp', size: 400_000 }).valid
    ).toBe(true);
    expect(
      validateImageFile({ name: 'script.svg', type: 'image/svg+xml', size: 10_000 }).valid
    ).toBe(false);
    expect(
      validateImageFile({ name: 'pesada.jpg', type: 'image/jpeg', size: 9 * 1024 * 1024 }).valid
    ).toBe(false);
  });
});
