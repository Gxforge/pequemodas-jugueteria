import {
  getChatEnvOrThrow,
  isChatSupabaseConfigured
} from './chat-supabase-client';
import type {
  CrmAdminNotification,
  CrmBotConfig,
  CrmChatMessage,
  CrmCustomerContact,
  CrmDirectOrder,
  CrmDirectOrderStatus,
  CrmStorageOverview
} from './crm-types';
import { getSupabaseClient } from './supabase-client';

async function invokeCrmAdminGateway<T>(
  action: string,
  payload: Record<string, unknown> = {}
): Promise<T> {
  const { url, anonKey } = getChatEnvOrThrow();
  const catalogClient = getSupabaseClient();
  const {
    data: { session }
  } = await catalogClient.auth.getSession();

  if (!session?.access_token) {
    throw new Error('Inicia sesión como administradora para ver mensajes y clientes.');
  }

  const res = await fetch(`${url}/functions/v1/crm-admin-gateway`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: anonKey,
      Authorization: `Bearer ${session.access_token}`
    },
    body: JSON.stringify({ action, ...payload })
  });

  const json = (await res.json()) as Record<string, unknown>;
  if (!res.ok) {
    throw new Error(String(json.error || 'Error al consultar la base de clientes.'));
  }
  return json as T;
}

export async function fetchCrmStorageOverview(): Promise<CrmStorageOverview | null> {
  if (!isChatSupabaseConfigured()) return null;
  try {
    return await invokeCrmAdminGateway<CrmStorageOverview>('overview');
  } catch {
    return null;
  }
}

export async function fetchCrmContacts(): Promise<CrmCustomerContact[]> {
  if (!isChatSupabaseConfigured()) return [];
  const res = await invokeCrmAdminGateway<{ contacts: CrmCustomerContact[] }>(
    'list_threads'
  );
  return res.contacts ?? [];
}

export async function fetchCrmThreadDetail(contactId: string): Promise<{
  contact: CrmCustomerContact | null;
  messages: CrmChatMessage[];
  orders: CrmDirectOrder[];
}> {
  return invokeCrmAdminGateway('get_thread', { contactId });
}

export async function sendCrmAdminReply(
  contactId: string,
  body: string
): Promise<void> {
  await invokeCrmAdminGateway('send_admin_message', { contactId, body });
}

export async function toggleCrmContactBot(
  contactId: string,
  botPaused: boolean
): Promise<void> {
  await invokeCrmAdminGateway('toggle_contact_bot', { contactId, botPaused });
}

export async function updateCrmDirectOrderStatus(
  orderId: string,
  status: CrmDirectOrderStatus
): Promise<void> {
  await invokeCrmAdminGateway('update_direct_order_status', { orderId, status });
}

export async function fetchCrmNotificationsAndBot(): Promise<{
  notifications: CrmAdminNotification[];
  botConfig: CrmBotConfig | null;
}> {
  if (!isChatSupabaseConfigured()) {
    return { notifications: [], botConfig: null };
  }
  return invokeCrmAdminGateway('list_notifications');
}

export async function markCrmNotificationsRead(
  notificationId?: string
): Promise<void> {
  if (!isChatSupabaseConfigured()) return;
  await invokeCrmAdminGateway('mark_notifications_read', {
    notificationId: notificationId ?? null
  });
}

export async function saveCrmBotConfig(
  patch: Partial<CrmBotConfig>
): Promise<CrmBotConfig> {
  const res = await invokeCrmAdminGateway<{ botConfig: CrmBotConfig }>(
    'save_bot_config',
    { patch }
  );
  return res.botConfig;
}
