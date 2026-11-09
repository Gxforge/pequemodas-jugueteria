import { z } from 'zod';
import { currencyCodeSchema } from './currency.schema';

export const inventoryModeSchema = z.enum(['quantity', 'manual']);
export const manualAvailabilitySchema = z.enum([
  'available',
  'out_of_stock',
  'inquire'
]);
export const publicationStatusSchema = z.enum([
  'draft',
  'published',
  'hidden',
  'archived'
]);

export const variantAttributePairSchema = z.object({
  key: z.string().trim().min(1, 'Indica el nombre del atributo (ej. Talla, Color).').max(40),
  value: z.string().trim().min(1, 'Indica el valor del atributo.').max(60)
});

export const productVariantInputSchema = z.object({
  id: z.string().uuid().optional(),
  name: z
    .string()
    .trim()
    .min(1, 'El nombre de la variante es obligatorio.')
    .max(100),
  sku: z.string().trim().max(50).optional().or(z.literal('')),
  attributes: z.record(z.string().trim().min(1), z.string().trim().min(1)).default({}),
  priceOverrideCup: z
    .union([z.coerce.number().min(0, 'El precio no puede ser negativo.'), z.null()])
    .optional()
    .default(null),
  stockQuantity: z.coerce
    .number()
    .int('La cantidad debe ser entera.')
    .min(0, 'No se permiten cantidades negativas.')
    .default(0),
  manualAvailability: manualAvailabilitySchema.default('available'),
  isActive: z.boolean().default(true),
  sortOrder: z.coerce.number().int().min(0).default(0)
});

export const productFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'El nombre del producto debe tener al menos 2 caracteres.')
    .max(140, 'Máximo 140 caracteres.'),
  slug: z
    .string()
    .trim()
    .min(2, 'El slug es obligatorio.')
    .max(160)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Formato de URL inválido.'),
  description: z.string().trim().max(3000, 'Máximo 3000 caracteres.').optional().or(z.literal('')),
  // El importe numérico se guarda en la columna histórica base_price_cup;
  // la moneda real de ese importe se define en currencyCode.
  basePriceCup: z.coerce
    .number()
    .min(0, 'El precio no puede ser negativo.')
    .max(9999999, 'Precio fuera de rango.'),
  currencyCode: currencyCodeSchema.default('CUP'),
  categoryId: z.string().uuid().nullable().optional(),
  subcategoryId: z.string().uuid().nullable().optional(),
  inventoryMode: inventoryModeSchema.default('quantity'),
  manualAvailability: manualAvailabilitySchema.default('available'),
  stockQuantity: z.coerce
    .number()
    .int('La cantidad debe ser entera.')
    .min(0, 'No se permiten cantidades negativas.')
    .default(0),
  publicationStatus: publicationStatusSchema.default('draft'),
  isFeatured: z.boolean().default(false)
});

export type InventoryMode = z.infer<typeof inventoryModeSchema>;
export type ManualAvailability = z.infer<typeof manualAvailabilitySchema>;
export type PublicationStatus = z.infer<typeof publicationStatusSchema>;
export type ProductVariantInput = z.infer<typeof productVariantInputSchema>;
export type ProductFormInput = z.infer<typeof productFormSchema>;
