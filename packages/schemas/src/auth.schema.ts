import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Ingresa tu correo electrónico.')
    .email('Ingresa un correo electrónico válido.'),
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres.')
});

export const passwordRecoverySchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Ingresa tu correo electrónico.')
    .email('Ingresa un correo electrónico válido.')
});

export const updatePasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'La nueva contraseña debe tener mínimo 8 caracteres.'),
    confirmPassword: z.string()
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword']
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type PasswordRecoveryInput = z.infer<typeof passwordRecoverySchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
