import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { parseClientEnv, type ClientEnv } from '@pequemodas/schemas';

let cachedClient: SupabaseClient | null = null;
let cachedEnv: ClientEnv | null = null;

function readViteEnv(): Record<string, unknown> {
  const metaEnv = (import.meta as unknown as { env?: Record<string, unknown> }).env ?? {};
  const filtered: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(metaEnv)) {
    if (k.startsWith('VITE_')) {
      filtered[k] = v;
    }
  }
  return filtered;
}

export function isSupabaseConfigured(): boolean {
  try {
    const raw = readViteEnv();
    parseClientEnv(raw);
    return true;
  } catch {
    return false;
  }
}

export function getClientEnv(): ClientEnv {
  if (!cachedEnv) {
    cachedEnv = parseClientEnv(readViteEnv());
  }
  return cachedEnv;
}

export function getSupabaseClient(): SupabaseClient {
  if (!cachedClient) {
    const env = getClientEnv();
    cachedClient = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
  }
  return cachedClient;
}
