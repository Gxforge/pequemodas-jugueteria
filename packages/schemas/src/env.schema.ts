import { z } from 'zod';

export const clientEnvSchema = z.object({
  VITE_SUPABASE_URL: z
    .string()
    .url('VITE_SUPABASE_URL debe ser una URL válida de Supabase.'),
  VITE_SUPABASE_ANON_KEY: z
    .string()
    .min(20, 'VITE_SUPABASE_ANON_KEY es obligatoria y válida.'),
  VITE_STOREFRONT_URL: z.string().url().optional(),
  VITE_ADMIN_URL: z.string().url().optional(),
  VITE_MAX_IMAGE_SIZE_MB: z.coerce.number().positive().max(15).default(5)
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;

export function parseClientEnv(rawEnv: Record<string, unknown>): ClientEnv {
  for (const key of Object.keys(rawEnv)) {
    if (key.toUpperCase().includes('SERVICE_ROLE')) {
      throw new Error(
        `Violación crítica de seguridad: la variable privada "${key}" no puede exponerse en el cliente.`
      );
    }
  }
  return clientEnvSchema.parse(rawEnv);
}
