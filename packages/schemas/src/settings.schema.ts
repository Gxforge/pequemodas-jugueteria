import { z } from 'zod';

export const socialLinksSchema = z.object({
  instagram: z.string().trim().max(200).optional().or(z.literal('')),
  facebook: z.string().trim().max(200).optional().or(z.literal('')),
  telegram: z.string().trim().max(200).optional().or(z.literal('')),
  whatsappGroup: z.string().trim().max(200).optional().or(z.literal(''))
});

export const storeSettingsFormSchema = z.object({
  commercialName: z
    .string()
    .trim()
    .min(2, 'El nombre comercial es obligatorio.')
    .max(120),
  description: z.string().trim().max(1000).optional().or(z.literal('')),
  logoUrl: z.string().trim().max(500).optional().or(z.literal('')),
  phone: z.string().trim().max(30).optional().or(z.literal('')),
  whatsappPhone: z
    .string()
    .trim()
    .max(30)
    .refine(
      (val) => val === '' || val.replace(/[^\d]/g, '').length >= 8,
      'Ingresa un número de WhatsApp válido con código de país (ej. +535xxxxxxx).'
    )
    .optional()
    .or(z.literal('')),
  address: z.string().trim().max(300).optional().or(z.literal('')),
  businessHours: z.string().trim().max(300).optional().or(z.literal('')),
  deliveryEnabled: z.boolean().default(true),
  pickupEnabled: z.boolean().default(true),
  deliveryInfo: z.string().trim().max(1200).optional().or(z.literal('')),
  pickupInfo: z.string().trim().max(1200).optional().or(z.literal('')),
  recordWhatsappRequests: z.boolean().default(true),
  socialLinks: socialLinksSchema.default({})
});

export type SocialLinks = z.infer<typeof socialLinksSchema>;
export type StoreSettingsFormInput = z.infer<typeof storeSettingsFormSchema>;
