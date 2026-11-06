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
  CrmShardId,
  CrmStorageOverview,
  DualProjectOverview
} from './crm-types';
import { getClientEnv, getSupabaseClient } from './supabase-client';

function parseShardKey(compositeId: string): { shard: CrmShardId; rawId: string } {
  if (compositeId.startsWith('p1:')) return { shard: 'p1', rawId: compositeId.slice(3) };
  if (compositeId.startsWith('p2:')) return { shard: 'p2', rawId: compositeId.slice(3) };
  return { shard: isChatSupabaseConfigured() ? 'p2' : 'p1', rawId: compositeId };
}

function getShardEndpoint(shard: CrmShardId): { url: string; anonKey: string } {
  if (shard === 'p2') return getChatEnvOrThrow();
  const env = getClientEnv();
  return {
    url: env.VITE_SUPABASE_URL.replace(/\/+$/, ''),
    anonKey: env.VITE_SUPABASE_ANON_KEY
  };
}

export async function invokeShardGateway<T>(
  shard: CrmShardId,
  action: string,
  payload: Record<string, unknown> = {}
): Promise<T> {
  const { url, anonKey } = getShardEndpoint(shard);
  const catalogClient = getSupabaseClient();
  const {
    data: { session }
  } = await catalogClient.auth.getSession();

  if (!session?.access_token) {
    throw new Error('Inicia sesión para consultar clientes y mensajes.');
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
    throw new Error(String(json.error || 'Error al conectar con la base de datos.'));
  }
  return json as T;
}

const EMPTY_OVERVIEW: CrmStorageOverview = {
  dbBytesUsed: 0,
  dbQuotaBytes: 524288000,
  storageBytesUsed: 0,
  storageQuotaBytes: 1073741824,
  contactsCount: 0,
  directOrdersCount: 0,
  pendingOrdersCount: 0,
  unreadChatsCount: 0,
  unreadNotificationsCount: 0,
  messagesCount: 0
};

export async function fetchDualProjectOverview(): Promise<DualProjectOverview> {
  const p1Promise = invokeShardGateway<CrmStorageOverview>('p1', 'overview').catch(
    () => EMPTY_OVERVIEW
  );
  const p2Promise = isChatSupabaseConfigured()
    ? invokeShardGateway<CrmStorageOverview>('p2', 'overview').catch(() => null)
    : Promise.resolve(null);

  const [p1, p2] = await Promise.all([p1Promise, p2Promise]);
  return {
    p1,
    p2,
    totalContactsCount: p1.contactsCount + (p2?.contactsCount ?? 0),
    totalDirectOrdersCount: p1.directOrdersCount + (p2?.directOrdersCount ?? 0),
    totalUnreadChatsCount: p1.unreadChatsCount + (p2?.unreadChatsCount ?? 0)
  };
}

export async function fetchCrmStorageOverview(): Promise<CrmStorageOverview | null> {
  const dual = await fetchDualProjectOverview();
  return dual.p2 ?? dual.p1;
}

export async function fetchCrmContacts(): Promise<CrmCustomerContact[]> {
  const shards: CrmShardId[] = isChatSupabaseConfigured() ? ['p1', 'p2'] : ['p1'];
  const lists = await Promise.all(
    shards.map(async (shard) => {
      try {
        const res = await invokeShardGateway<{ contacts: CrmCustomerContact[] }>(
          shard,
          'list_threads'
        );
        return (res.contacts ?? []).map((c) => ({
          ...c,
          raw_id: c.id,
          shard,
          id: `${shard}:${c.id}`
        }));
      } catch {
        return [];
      }
    })
  );

  return lists
    .flat()
    .sort((a, b) => b.last_message_at.localeCompare(a.last_message_at));
}

export async function fetchCrmThreadDetail(compositeContactId: string): Promise<{
  contact: CrmCustomerContact | null;
  messages: CrmChatMessage[];
  orders: CrmDirectOrder[];
}> {
  const { shard, rawId } = parseShardKey(compositeContactId);
  const res = await invokeShardGateway<{
    contact: CrmCustomerContact | null;
    messages: CrmChatMessage[];
    orders: CrmDirectOrder[];
  }>(shard, 'get_thread', { contactId: rawId });

  return {
    contact: res.contact
      ? { ...res.contact, raw_id: res.contact.id, shard, id: `${shard}:${res.contact.id}` }
      : null,
    messages: res.messages ?? [],
    orders: res.orders ?? []
  };
}

export async function sendCrmAdminReply(
  compositeContactId: string,
  body: string
): Promise<CrmChatMessage | null> {
  const { shard, rawId } = parseShardKey(compositeContactId);
  const res = await invokeShardGateway<{ message?: CrmChatMessage }>(
    shard,
    'send_admin_message',
    { contactId: rawId, body }
  );
  return res.message ?? null;
}

export async function toggleCrmContactBot(
  compositeContactId: string,
  botPaused: boolean
): Promise<void> {
  const { shard, rawId } = parseShardKey(compositeContactId);
  await invokeShardGateway(shard, 'toggle_contact_bot', {
    contactId: rawId,
    botPaused
  });
}

export async function updateCrmDirectOrderStatus(
  compositeContactId: string,
  orderId: string,
  status: CrmDirectOrderStatus
): Promise<void> {
  const { shard } = parseShardKey(compositeContactId);
  await invokeShardGateway(shard, 'update_direct_order_status', { orderId, status });
}

export async function fetchCrmNotificationsAndBot(): Promise<{
  notifications: CrmAdminNotification[];
  botConfig: CrmBotConfig | null;
}> {
  const shards: CrmShardId[] = isChatSupabaseConfigured() ? ['p1', 'p2'] : ['p1'];
  const bundles = await Promise.all(
    shards.map(async (shard) => {
      try {
        const res = await invokeShardGateway<{
          notifications: CrmAdminNotification[];
          botConfig: CrmBotConfig | null;
        }>(shard, 'list_notifications');
        return {
          botConfig: res.botConfig,
          notifications: (res.notifications ?? []).map((n) => ({
            ...n,
            raw_id: n.id,
            shard,
            id: `${shard}:${n.id}`,
            contact_id: n.contact_id ? `${shard}:${n.contact_id}` : null
          }))
        };
      } catch {
        return { botConfig: null, notifications: [] };
      }
    })
  );

  const notifications = bundles
    .flatMap((b) => b.notifications)
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at));
  const botConfig = bundles.find((b) => b.botConfig)?.botConfig ?? null;
  return { notifications, botConfig };
}

export async function markCrmNotificationsRead(
  compositeNotificationId?: string
): Promise<void> {
  if (compositeNotificationId) {
    const { shard, rawId } = parseShardKey(compositeNotificationId);
    await invokeShardGateway(shard, 'mark_notifications_read', {
      notificationId: rawId
    });
    return;
  }
  const shards: CrmShardId[] = isChatSupabaseConfigured() ? ['p1', 'p2'] : ['p1'];
  await Promise.all(
    shards.map((s) =>
      invokeShardGateway(s, 'mark_notifications_read', { notificationId: null }).catch(
        () => undefined
      )
    )
  );
}

export async function saveCrmBotConfig(
  patch: Partial<CrmBotConfig>
): Promise<CrmBotConfig> {
  const shards: CrmShardId[] = isChatSupabaseConfigured() ? ['p1', 'p2'] : ['p1'];
  const results = await Promise.all(
    shards.map((s) =>
      invokeShardGateway<{ botConfig: CrmBotConfig }>(s, 'save_bot_config', { patch })
    )
  );
  return results[0]!.botConfig;
}
