import { z } from 'zod';

export const categoryFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'El nombre debe tener al menos 2 caracteres.')
    .max(80, 'Máximo 80 caracteres.'),
  slug: z
    .string()
    .trim()
    .min(2, 'El identificador URL es obligatorio.')
    .max(90)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Usa solo letras minúsculas, números y guiones.'),
  description: z.string().trim().max(400, 'Máximo 400 caracteres.').optional().or(z.literal('')),
  parentId: z.string().uuid().nullable().optional(),
  sortOrder: z.coerce.number().int().min(0).max(9999).default(0),
  isActive: z.boolean().default(true),
  isArchived: z.boolean().default(false)
});

export type CategoryFormInput = z.infer<typeof categoryFormSchema>;
