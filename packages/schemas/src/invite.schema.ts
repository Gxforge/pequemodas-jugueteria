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
      .toLowerCase()
      .min(1, 'Ingresa tu correo electrónico.')
      .email('Escribe un correo válido completo (ejemplo: katia@gmail.com).'),
    password: z
      .string()
      .min(8, 'La contraseña debe tener al menos 8 letras o números.'),
    confirmPassword: z.string()
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: 'Las dos contraseñas no coinciden. Toca «Ver» para compararlas.',
    path: ['confirmPassword']
  });

export type AcceptAdminInviteInput = z.infer<typeof acceptAdminInviteSchema>;
