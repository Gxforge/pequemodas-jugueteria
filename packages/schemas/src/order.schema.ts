import { z } from 'zod';

export const deliveryModeSchema = z.enum(['delivery', 'pickup']);
export const orderStatusSchema = z.enum([
  'request_received',
  'confirmed',
  'cancelled',
  'completed'
]);

export const whatsappCheckoutSchema = z
  .object({
    deliveryMode: deliveryModeSchema,
    customerName: z
      .string()
      .trim()
      .min(2, 'Por favor indica tu nombre para atenderte por WhatsApp.')
      .max(100),
    customerPhone: z
      .string()
      .trim()
      .max(30)
      .optional()
      .or(z.literal('')),
    deliveryAddress: z
      .string()
      .trim()
      .max(300)
      .optional()
      .or(z.literal('')),
    deliveryNotes: z
      .string()
      .trim()
      .max(400)
      .optional()
      .or(z.literal(''))
  })
  .superRefine((val, ctx) => {
    if (val.deliveryMode === 'delivery' && (!val.deliveryAddress || val.deliveryAddress.trim().length < 4)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['deliveryAddress'],
        message: 'Indica tu dirección o referencia para coordinar la entrega.'
      });
    }
  });

export type DeliveryModeType = z.infer<typeof deliveryModeSchema>;
export type OrderStatus = z.infer<typeof orderStatusSchema>;
export type WhatsAppCheckoutInput = z.infer<typeof whatsappCheckoutSchema>;
