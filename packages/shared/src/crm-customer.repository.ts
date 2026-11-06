import {
  getChatSupabaseClient,
  isChatSupabaseConfigured
} from './chat-supabase-client';
import type {
  CrmChatMessage,
  CrmDirectOrder,
  CrmDirectOrderLine
} from './crm-types';

const CUSTOMER_TOKEN_KEY = 'pequemodas.customer.token.v1';
const CUSTOMER_PROFILE_KEY = 'pequemodas.customer.profile.v1';
const SESSION_SIGNAL_KEY = 'pequemodas.cart.session.v1';

export interface StoredCustomerIdentity {
  customerToken: string;
  fullName: string;
  phone: string;
  address?: string;
}

export function getStoredCustomerIdentity(): StoredCustomerIdentity | null {
  try {
    const raw = localStorage.getItem(CUSTOMER_PROFILE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredCustomerIdentity;
  } catch {
    return null;
  }
}

function saveCustomerIdentity(identity: StoredCustomerIdentity): void {
  try {
    localStorage.setItem(CUSTOMER_TOKEN_KEY, identity.customerToken);
    localStorage.setItem(CUSTOMER_PROFILE_KEY, JSON.stringify(identity));
  } catch {
    // Modo privado estricto
  }
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
  const client = getChatSupabaseClient();
  const prev = getStoredCustomerIdentity();
  const { data, error } = await client.rpc('open_or_update_customer_contact', {
    p_customer_token: prev?.customerToken ?? null,
    p_full_name: input.fullName.trim(),
    p_phone: input.phone.trim(),
    p_address: input.address?.trim() || null
  });

  if (error || !data) {
    throw new Error(error?.message ?? 'No se pudo conectar con el chat de la tienda.');
  }

  const res = data as {
    customer_token: string;
    full_name: string;
    phone: string;
    municipality_or_address?: string | null;
  };
  const saved: StoredCustomerIdentity = {
    customerToken: res.customer_token,
    fullName: res.full_name,
    phone: res.phone,
    address: res.municipality_or_address ?? input.address
  };
  saveCustomerIdentity(saved);
  return saved;
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
  if (!isChatSupabaseConfigured()) {
    return { contact: null, messages: [], orders: [] };
  }
  const identity = getStoredCustomerIdentity();
  if (!identity?.customerToken) {
    return { contact: null, messages: [], orders: [] };
  }

  const client = getChatSupabaseClient();
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
  const client = getChatSupabaseClient();
  const { error } = await client.rpc('send_customer_message', {
    p_customer_token: identity.customerToken,
    p_body: body.trim()
  });
  if (error) {
    throw new Error(error.message);
  }
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
  const client = getChatSupabaseClient();
  const prev = getStoredCustomerIdentity();
  const { data, error } = await client.rpc('submit_direct_app_order', {
    p_customer_token: prev?.customerToken ?? null,
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
  if (!isChatSupabaseConfigured()) return;
  try {
    const client = getChatSupabaseClient();
    await client.rpc('record_cart_activity_signal', {
      p_session_key: getOrCreateCartSessionId(),
      p_product_name: input.productName,
      p_cart_count: input.cartCount,
      p_estimated_cup: input.estimatedCup
    });
  } catch {
    // Nunca interrumpir la experiencia de compra por telemetría
  }
}
