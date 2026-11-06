export interface CrmCustomerContact {
  id: string;
  customer_token: string;
  full_name: string;
  phone: string;
  municipality_or_address: string | null;
  notes: string | null;
  bot_paused: boolean;
  unread_for_admin: number;
  unread_for_customer: number;
  last_message_preview: string | null;
  last_message_at: string;
  created_at: string;
  updated_at: string;
}

export interface CrmDirectOrderLine {
  product_id: string;
  variant_id: string | null;
  product_name: string;
  variant_name: string | null;
  attributes: Record<string, string>;
  quantity: number;
  unit_price_cup: number;
}

export type CrmDirectOrderStatus =
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'completed'
  | 'cancelled';

export interface CrmDirectOrder {
  id: string;
  reference_code: string;
  contact_id: string;
  delivery_mode: 'delivery' | 'pickup';
  delivery_address: string | null;
  delivery_notes: string | null;
  items: CrmDirectOrderLine[];
  estimated_total_cup: number;
  status: CrmDirectOrderStatus;
  created_at: string;
  updated_at: string;
}

export interface CrmChatMessage {
  id: string;
  contact_id?: string;
  sender_role: 'customer' | 'admin' | 'bot';
  sender_name: string | null;
  body: string;
  order_id: string | null;
  created_at: string;
}

export interface CrmAdminNotification {
  id: string;
  kind: 'direct_order' | 'customer_message' | 'cart_activity';
  title: string;
  body: string;
  contact_id: string | null;
  order_id: string | null;
  dedupe_key: string | null;
  event_count: number;
  is_read: boolean;
  created_at: string;
  updated_at: string;
}

export interface CrmBotKeywordRule {
  id: string;
  keywords: string[];
  reply: string;
  active: boolean;
}

export interface CrmBotConfig {
  id: number;
  is_enabled: boolean;
  bot_name: string;
  welcome_message: string;
  order_received_message: string;
  offline_or_wait_message: string;
  keyword_rules: CrmBotKeywordRule[];
  notify_on_cart_add: boolean;
  notify_on_chat: boolean;
  cart_cooldown_minutes: number;
  updated_at: string;
}

export interface CrmStorageOverview {
  dbBytesUsed: number;
  dbQuotaBytes: number;
  contactsCount: number;
  directOrdersCount: number;
  pendingOrdersCount: number;
  unreadChatsCount: number;
  unreadNotificationsCount: number;
  messagesCount: number;
}
