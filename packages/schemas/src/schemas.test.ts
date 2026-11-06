import { describe, expect, it } from 'vitest';
import {
  inventoryMovementInputSchema,
  parseClientEnv,
  productFormSchema,
  productVariantInputSchema,
  storeSettingsFormSchema,
  whatsappCheckoutSchema
} from './index';

describe('@pequemodas/schemas', () => {
  it('bloquea exposición de SERVICE_ROLE en el entorno del cliente', () => {
    expect(() =>
      parseClientEnv({
        VITE_SUPABASE_URL: 'https://demo.supabase.co',
        VITE_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.valid_anon',
        VITE_SUPABASE_SERVICE_ROLE_KEY: 'secreto'
      })
    ).toThrow(/Violación crítica de seguridad/);
  });

  it('impide precios o cantidades negativas en productos y variantes', () => {
    const badProduct = productFormSchema.safeParse({
      name: 'Carrito',
      slug: 'carrito',
      basePriceCup: -50,
      stockQuantity: 1
    });
    expect(badProduct.success).toBe(false);

    const flexVariant = productVariantInputSchema.parse({
      name: 'Talla 6 - Azul',
      attributes: {
        Talla: '6 años',
        Color: 'Azul',
        Diseño: 'Estrellas',
        Temporada: 'Verano'
      },
      priceOverrideCup: 2100,
      stockQuantity: 4
    });
    expect(Object.keys(flexVariant.attributes)).toHaveLength(4);

    const negMovement = inventoryMovementInputSchema.safeParse({
      productId: '550e8400-e29b-41d4-a716-446655440000',
      movementType: 'in',
      quantity: -3,
      reason: 'Prueba'
    });
    expect(negMovement.success).toBe(false);
  });

  it('exige dirección cuando el cliente elige entrega a domicilio pero no en recogida', () => {
    const missingAddr = whatsappCheckoutSchema.safeParse({
      deliveryMode: 'delivery',
      customerName: 'Carlos',
      deliveryAddress: ''
    });
    expect(missingAddr.success).toBe(false);

    const validPickup = whatsappCheckoutSchema.safeParse({
      deliveryMode: 'pickup',
      customerName: 'Carlos'
    });
    expect(validPickup.success).toBe(true);
  });

  it('permite configuración de tienda sin valores comerciales inventados', () => {
    const parsed = storeSettingsFormSchema.parse({
      commercialName: 'PequeModas-Juguetería',
      whatsappPhone: ''
    });
    expect(parsed.commercialName).toBe('PequeModas-Juguetería');
  });
});
