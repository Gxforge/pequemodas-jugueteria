import { z } from 'zod';
import { inventoryModeSchema, manualAvailabilitySchema } from './product.schema';

export const movementTypeSchema = z.enum(['in', 'out', 'adjustment']);

export const inventoryMovementInputSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().nullable().optional(),
  movementType: movementTypeSchema,
  quantity: z.coerce
    .number()
    .int('La cantidad debe ser un número entero.')
    .min(0, 'El valor no puede ser negativo.'),
  reason: z
    .string()
    .trim()
    .min(2, 'Indica brevemente el motivo del movimiento.')
    .max(240)
});

export const switchInventoryModeSchema = z.object({
  productId: z.string().uuid(),
  targetMode: inventoryModeSchema,
  manualAvailability: manualAvailabilitySchema.default('available'),
  confirmed: z.literal(true, {
    errorMap: () => ({ message: 'Debes confirmar el cambio de modalidad.' })
  })
});

export type MovementType = z.infer<typeof movementTypeSchema>;
export type InventoryMovementInput = z.infer<typeof inventoryMovementInputSchema>;
export type SwitchInventoryModeInput = z.infer<typeof switchInventoryModeSchema>;
