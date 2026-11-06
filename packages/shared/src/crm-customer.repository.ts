import type { SupabaseClient } from '@supabase/supabase-js';
import {
  getChatSupabaseClient,
  isChatSupabaseConfigured
} from './chat-supabase-client';
import type {
  CrmChatMessage,
  CrmDirectOrder,
  CrmDirectOrderLine,
  CrmShardId
} from './crm-types';
import { getSupabaseClient, isSupabaseConfigured } from './supabase-client';

const CUSTOMER_PROFILE_KEY = 'pequemodas.customer.profile.v2';
const LEGACY_PROFILE_KEY = 'pequemodas.customer.profile.v1';
const RR_COUNTER_KEY = 'pequemodas.rr.chat.v1';
const SESSION_SIGNAL_KEY = 'pequemodas.cart.session.v1';

export interface StoredCustomerIdentity {
  customerToken: string;
  shard: CrmShardId;
  fullName: string;
  phone: string;
  address?: string;
}

export function getStoredCustomerIdentity(): StoredCustomerIdentity | null {
  try {
    const rawV2 = localStorage.getItem(CUSTOMER_PROFILE_KEY);
    if (rawV2) return JSON.parse(rawV2) as StoredCustomerIdentity;
    const rawV1 = localStorage.getItem(LEGACY_PROFILE_KEY);
    if (rawV1) {
      const legacy = JSON.parse(rawV1) as Omit<StoredCustomerIdentity, 'shard'>;
      return { ...legacy, shard: 'p2' };
    }
    return null;
  } catch {
    return null;
  }
}

function saveCustomerIdentity(identity: StoredCustomerIdentity): void {
  try {
    localStorage.setItem(CUSTOMER_PROFILE_KEY, JSON.stringify(identity));
  } catch {
    // Modo privado estricto
  }
}

function pickNextRoundRobinShard(): CrmShardId {
  if (!isChatSupabaseConfigured()) return 'p1';
  if (!isSupabaseConfigured()) return 'p2';
  try {
    const prev = localStorage.getItem(RR_COUNTER_KEY);
    let next: CrmShardId;
    if (prev === 'p1') next = 'p2';
    else if (prev === 'p2') next = 'p1';
    else next = Math.random() < 0.5 ? 'p1' : 'p2';
    localStorage.setItem(RR_COUNTER_KEY, next);
    return next;
  } catch {
    return Math.random() < 0.5 ? 'p1' : 'p2';
  }
}

function getShardClient(shard: CrmShardId): SupabaseClient {
  if (shard === 'p2' && isChatSupabaseConfigured()) {
    return getChatSupabaseClient();
  }
  return getSupabaseClient();
}

function getOrCreateCartSessionId(): string {
  try {
    let existing = sessionStorage.getItem(SESSION_SIGNAL_KEY);
    if (!existing) {
      existing = `s_${Math.random().toString(36).slice(2, 12)}`;
      sessionStorage.setItem(SESSION_SIGNAL_KEY, existing);
    }
    return existing;
  } catch {
    return 'anon_session';
  }
}

export async function openOrResumeCustomerChat(input: {
  fullName: string;
  phone: string;
  address?: string;
}): Promise<StoredCustomerIdentity> {
  const prev = getStoredCustomerIdentity();
  const preferredShard = prev?.shard ?? pickNextRoundRobinShard();
  const fallbackShard: CrmShardId = preferredShard === 'p1' ? 'p2' : 'p1';

  const attemptOnShard = async (shard: CrmShardId) => {
    const client = getShardClient(shard);
    const { data, error } = await client.rpc('open_or_update_customer_contact', {
      p_customer_token: prev?.shard === shard ? prev.customerToken : null,
      p_full_name: input.fullName.trim(),
      p_phone: input.phone.trim(),
      p_address: input.address?.trim() || null
    });
    if (error || !data) {
      throw new Error(error?.message ?? 'Error al abrir conversación.');
    }
    const res = data as {
      customer_token: string;
      full_name: string;
      phone: string;
      municipality_or_address?: string | null;
    };
    const saved: StoredCustomerIdentity = {
      customerToken: res.customer_token,
      shard,
      fullName: res.full_name,
      phone: res.phone,
      address: res.municipality_or_address ?? input.address
    };
    saveCustomerIdentity(saved);
    return saved;
  };

  try {
    return await attemptOnShard(preferredShard);
  } catch (err) {
    if (!prev && isChatSupabaseConfigured() && isSupabaseConfigured()) {
      return attemptOnShard(fallbackShard);
    }
    throw err;
  }
}

export async function fetchCustomerChatThread(): Promise<{
  contact: { id: string; full_name: string; phone: string } | null;
  messages: CrmChatMessage[];
  orders: Array<
    Pick<
      CrmDirectOrder,
      'id' | 'reference_code' | 'delivery_mode' | 'estimated_total_cup' | 'status' | 'created_at'
    >
  >;
}> {
  const identity = getStoredCustomerIdentity();
  if (!identity?.customerToken) {
    return { contact: null, messages: [], orders: [] };
  }

  const client = getShardClient(identity.shard);
  const { data, error } = await client.rpc('fetch_customer_thread', {
    p_customer_token: identity.customerToken
  });
  if (error || !data) {
    return { contact: null, messages: [], orders: [] };
  }

  const parsed = data as {
    contact: { id: string; full_name: string; phone: string } | null;
    messages: CrmChatMessage[];
    orders: CrmDirectOrder[];
  };
  return {
    contact: parsed.contact ?? null,
    messages: parsed.messages ?? [],
    orders: parsed.orders ?? []
  };
}

export async function sendCustomerChatMessage(body: string): Promise<void> {
  const identity = getStoredCustomerIdentity();
  if (!identity?.customerToken) {
    throw new Error('Ingresa primero tu nombre y teléfono para chatear.');
  }
  const client = getShardClient(identity.shard);
  const { error } = await client.rpc('send_customer_message', {
    p_customer_token: identity.customerToken,
    p_body: body.trim()
  });
  if (error) throw new Error(error.message);
}

export async function submitDirectAppOrder(input: {
  fullName: string;
  phone: string;
  deliveryMode: 'delivery' | 'pickup';
  deliveryAddress?: string;
  deliveryNotes?: string;
  items: CrmDirectOrderLine[];
  estimatedTotalCup: number;
}): Promise<{ referenceCode: string; orderId: string }> {
  const prev = getStoredCustomerIdentity();
  const shard = prev?.shard ?? pickNextRoundRobinShard();
  const client = getShardClient(shard);

  const { data, error } = await client.rpc('submit_direct_app_order', {
    p_customer_token: prev?.shard === shard ? prev.customerToken : null,
    p_full_name: input.fullName.trim(),
    p_phone: input.phone.trim(),
    p_delivery_mode: input.deliveryMode,
    p_delivery_address: input.deliveryAddress?.trim() || null,
    p_delivery_notes: input.deliveryNotes?.trim() || null,
    p_items: input.items,
    p_estimated_total_cup: input.estimatedTotalCup
  });

  if (error || !data) {
    throw new Error(error?.message ?? 'No se pudo enviar el pedido directo.');
  }

  const res = data as {
    order_id: string;
    reference_code: string;
    customer_token: string;
  };
  saveCustomerIdentity({
    customerToken: res.customer_token,
    shard,
    fullName: input.fullName.trim(),
    phone: input.phone.trim(),
    address: input.deliveryAddress?.trim()
  });

  return { referenceCode: res.reference_code, orderId: res.order_id };
}

export async function notifyCartAdditionQuietly(input: {
  productName: string;
  cartCount: number;
  estimatedCup: number;
}): Promise<void> {
  try {
    const identity = getStoredCustomerIdentity();
    const shard: CrmShardId = identity?.shard ?? (isChatSupabaseConfigured() ? 'p2' : 'p1');
    const client = getShardClient(shard);
    await client.rpc('record_cart_activity_signal', {
      p_session_key: getOrCreateCartSessionId(),
      p_product_name: input.productName,
      p_cart_count: input.cartCount,
      p_estimated_cup: input.estimatedCup
    });
  } catch {
    // Silencioso para no afectar experiencia de compra
  }
}
