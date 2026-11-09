import type { CurrencyCode, CurrencyTotals } from '@pequemodas/config';

export type CrmShardId = 'p1' | 'p2';

export interface CrmChatThemeConfig {
  headerFrom: string;
  headerTo: string;
  botBubbleBg: string;
  botBubbleText: string;
  customerBubbleBg: string;
  customerBubbleText: string;
  adminBubbleBg: string;
  adminBubbleText: string;
  chatBg: string;
}

export const DEFAULT_CHAT_THEME: CrmChatThemeConfig = {
  headerFrom: '#ec4899',
  headerTo: '#0284c7',
  botBubbleBg: '#e0f2fe',
  botBubbleText: '#0f172a',
  customerBubbleBg: '#dcf8c6',
  customerBubbleText: '#0f172a',
  adminBubbleBg: '#ffffff',
  adminBubbleText: '#0f172a',
  chatBg: '#f4efe6'
};

export interface ChatThemePreset {
  id: string;
  name: string;
  theme: CrmChatThemeConfig;
}

export const CHAT_THEME_PRESETS: ChatThemePreset[] = [
  {
    id: 'pequemodas',
    name: 'PequeModas (Rosa y Cielo)',
    theme: DEFAULT_CHAT_THEME
  },
  {
    id: 'whatsapp',
    name: 'Estilo WhatsApp Clásico',
    theme: {
      headerFrom: '#059669',
      headerTo: '#0d9488',
      botBubbleBg: '#ecfdf5',
      botBubbleText: '#064e3b',
      customerBubbleBg: '#dcf8c6',
      customerBubbleText: '#0f172a',
      adminBubbleBg: '#ffffff',
      adminBubbleText: '#0f172a',
      chatBg: '#efeae2'
    }
  },
  {
    id: 'coral',
    name: 'Dulce Coral Infantil',
    theme: {
      headerFrom: '#f43f5e',
      headerTo: '#fb923c',
      botBubbleBg: '#fff1f2',
      botBubbleText: '#881337',
      customerBubbleBg: '#ffe4e6',
      customerBubbleText: '#4c0519',
      adminBubbleBg: '#ffffff',
      adminBubbleText: '#1e293b',
      chatBg: '#fff7ed'
    }
  },
  {
    id: 'lavender',
    name: 'Lavanda Mágica',
    theme: {
      headerFrom: '#8b5cf6',
      headerTo: '#ec4899',
      botBubbleBg: '#f3e8ff',
      botBubbleText: '#3b0764',
      customerBubbleBg: '#ede9fe',
      customerBubbleText: '#1e1b4b',
      adminBubbleBg: '#ffffff',
      adminBubbleText: '#0f172a',
      chatBg: '#faf5ff'
    }
  },
  {
    id: 'ocean',
    name: 'Azul Algodón',
    theme: {
      headerFrom: '#0284c7',
      headerTo: '#38bdf8',
      botBubbleBg: '#e0f2fe',
      botBubbleText: '#0c4a6e',
      customerBubbleBg: '#bae6fd',
      customerBubbleText: '#082f49',
      adminBubbleBg: '#ffffff',
      adminBubbleText: '#0f172a',
      chatBg: '#f0f9ff'
    }
  }
];

export interface CrmCustomerContact {
  id: string;
  raw_id?: string;
  shard?: CrmShardId;
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
  currency_code?: CurrencyCode;
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
  // Subtotal exclusivo en CUP; el desglose completo está en totals_by_currency.
  estimated_total_cup: number;
  totals_by_currency?: CurrencyTotals | null;
  status: CrmDirectOrderStatus;
  created_at: string;
  updated_at: string;
}

export type MessageDeliveryState = 'sending' | 'sent' | 'read' | 'failed';

export interface CrmChatMessage {
  id: string;
  contact_id?: string;
  sender_role: 'customer' | 'admin' | 'bot';
  sender_name: string | null;
  body: string;
  order_id: string | null;
  read_at?: string | null;
  created_at: string;
  delivery_state?: MessageDeliveryState;
}

export interface CrmAdminNotification {
  id: string;
  raw_id?: string;
  shard?: CrmShardId;
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
  header_title?: string;
  header_subtitle?: string;
  theme_config?: CrmChatThemeConfig;
  welcome_message: string;
  order_received_message: string;
  offline_or_wait_message: string;
  keyword_rules: CrmBotKeywordRule[];
  notify_on_cart_add: boolean;
  notify_on_chat: boolean;
  cart_cooldown_minutes: number;
  updated_at: string;
}

export interface PublicBotAppearance {
  is_enabled: boolean;
  bot_name: string;
  header_title: string;
  header_subtitle: string;
  welcome_message: string;
  theme_config: CrmChatThemeConfig;
}

export interface CrmStorageOverview {
  dbBytesUsed: number;
  dbQuotaBytes: number;
  storageBytesUsed: number;
  storageQuotaBytes: number;
  contactsCount: number;
  directOrdersCount: number;
  pendingOrdersCount: number;
  unreadChatsCount: number;
  unreadNotificationsCount: number;
  messagesCount: number;
}

export interface DualProjectOverview {
  p1: CrmStorageOverview;
  p2: CrmStorageOverview | null;
  totalContactsCount: number;
  totalDirectOrdersCount: number;
  totalUnreadChatsCount: number;
}
