import { z } from 'zod';

export const acceptAdminInviteSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(2, 'Ingresa tu nombre.')
      .max(80),
    email: z
      .string()
      .trim()
      .min(1, 'Ingresa tu correo electrónico.')
      .email('Ingresa un correo electrónico válido.'),
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 caracteres.'),
    confirmPassword: z.string()
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword']
  });

export type AcceptAdminInviteInput = z.infer<typeof acceptAdminInviteSchema>;
