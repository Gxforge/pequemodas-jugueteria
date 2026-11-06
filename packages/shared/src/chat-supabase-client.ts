import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cachedChatClient: SupabaseClient | null = null;

function readChatEnv(): { url: string; anonKey: string } | null {
  const metaEnv =
    (import.meta as unknown as { env?: Record<string, unknown> }).env ?? {};
  const url = String(metaEnv.VITE_CHAT_SUPABASE_URL ?? '').trim();
  const anonKey = String(metaEnv.VITE_CHAT_SUPABASE_ANON_KEY ?? '').trim();
  if (!url.startsWith('http') || anonKey.length < 20) {
    return null;
  }
  return { url: url.replace(/\/+$/, ''), anonKey };
}

export function isChatSupabaseConfigured(): boolean {
  return readChatEnv() !== null;
}

export function getChatEnvOrThrow(): { url: string; anonKey: string } {
  const cfg = readChatEnv();
  if (!cfg) {
    throw new Error(
      'La base de datos de Chat y Clientes (Proyecto 2) aún no está configurada.'
    );
  }
  return cfg;
}

export function getChatSupabaseClient(): SupabaseClient {
  if (!cachedChatClient) {
    const cfg = getChatEnvOrThrow();
    cachedChatClient = createClient(cfg.url, cfg.anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        storageKey: 'pequemodas-crm-public'
      }
    });
  }
  return cachedChatClient;
}
