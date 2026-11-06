import { describe, expect, it } from 'vitest';
import {
  resolveProductAvailability,
  resolveVariantAvailability,
  type ProductDetailDto
} from './index';

const baseProduct: ProductDetailDto = {
  id: '11111111-1111-1111-1111-111111111111',
  store_id: '22222222-2222-2222-2222-222222222222',
  category_id: null,
  subcategory_id: null,
  name: 'Rompecabezas Infantil',
  slug: 'rompecabezas-infantil',
  description: null,
  base_price_cup: 1200,
  inventory_mode: 'quantity',
  manual_availability: 'available',
  publication_status: 'published',
  is_featured: false,
  has_variants: false,
  created_at: '2026-11-06T00:00:00Z',
  updated_at: '2026-11-06T00:00:00Z',
  images: [],
  variants: [],
  inventory: [
    {
      id: '33333333-3333-3333-3333-333333333333',
      product_id: '11111111-1111-1111-1111-111111111111',
      variant_id: null,
      quantity: 3,
      low_stock_threshold: 2,
      updated_at: '2026-11-06T00:00:00Z'
    }
  ]
};

describe('Inventario híbrido y resolución de variantes', () => {
  it('calcula disponibilidad en Modalidad A (cantidades) y bloquea cuando llega a 0', () => {
    const ok = resolveProductAvailability(baseProduct);
    expect(ok.status).toBe('available');
    expect(ok.availableQuantity).toBe(3);
    expect(ok.canAddToCart).toBe(true);

    const zero = resolveProductAvailability({
      ...baseProduct,
      inventory: [{ ...baseProduct.inventory[0]!, quantity: 0 }]
    });
    expect(zero.status).toBe('out_of_stock');
    expect(zero.canAddToCart).toBe(false);
  });

  it('respeta Modalidad B (disponibilidad manual: consultar disponibilidad / agotado)', () => {
    const inquire = resolveProductAvailability({
      ...baseProduct,
      inventory_mode: 'manual',
      manual_availability: 'inquire'
    });
    expect(inquire.status).toBe('inquire');
    expect(inquire.availableQuantity).toBeNull();
    expect(inquire.canAddToCart).toBe(true);
  });

  it('aplica precio propio de variante cuando existe override en CUP', () => {
    const variant = {
      id: '44444444-4444-4444-4444-444444444444',
      product_id: baseProduct.id,
      name: 'Edición Grande',
      sku: null,
      attributes: { Tamaño: 'Grande' },
      price_override_cup: 1650,
      manual_availability: 'available' as const,
      is_active: true,
      sort_order: 0,
      created_at: '2026-11-06T00:00:00Z',
      updated_at: '2026-11-06T00:00:00Z'
    };
    const res = resolveVariantAvailability(
      {
        ...baseProduct,
        inventory: [
          {
            id: '55555555-5555-5555-5555-555555555555',
            product_id: baseProduct.id,
            variant_id: variant.id,
            quantity: 2,
            low_stock_threshold: 1,
            updated_at: '2026-11-06T00:00:00Z'
          }
        ]
      },
      variant
    );
    expect(res.unitPriceCup).toBe(1650);
    expect(res.availableQuantity).toBe(2);
  });
});
