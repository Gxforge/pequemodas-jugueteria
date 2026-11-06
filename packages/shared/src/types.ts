import type {
  DeliveryModeType,
  InventoryMode,
  ManualAvailability,
  OrderStatus,
  PublicationStatus,
  SocialLinks
} from '@pequemodas/schemas';

export interface StoreRow {
  id: string;
  slug: string;
  name: string;
  owner_name: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProfileRow {
  id: string;
  store_id: string | null;
  email: string;
  full_name: string | null;
  role: 'owner' | 'admin';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface StoreSettingsRow {
  id: string;
  store_id: string;
  commercial_name: string;
  logo_url: string | null;
  logo_storage_path: string | null;
  description: string | null;
  phone: string | null;
  whatsapp_phone: string | null;
  address: string | null;
  business_hours: string | null;
  delivery_enabled: boolean;
  pickup_enabled: boolean;
  delivery_info: string | null;
  pickup_info: string | null;
  record_whatsapp_requests: boolean;
  social_links: SocialLinks;
  created_at: string;
  updated_at: string;
}

export interface CategoryRow {
  id: string;
  store_id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  image_url?: string | null;
  image_storage_path?: string | null;
  sort_order: number;
  is_active: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductImageRow {
  id: string;
  product_id: string;
  storage_bucket: string;
  storage_path: string;
  thumbnail_path: string | null;
  public_url: string;
  thumbnail_url: string | null;
  alt_text: string | null;
  mime_type: string;
  size_bytes: number;
  width: number | null;
  height: number | null;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
}

export interface InventoryRow {
  id: string;
  product_id: string;
  variant_id: string | null;
  quantity: number;
  low_stock_threshold: number;
  updated_at: string;
}

export interface ProductVariantRow {
  id: string;
  product_id: string;
  name: string;
  sku: string | null;
  attributes: Record<string, string>;
  price_override_cup: number | null;
  manual_availability: ManualAvailability;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProductRow {
  id: string;
  store_id: string;
  category_id: string | null;
  subcategory_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  base_price_cup: number;
  inventory_mode: InventoryMode;
  manual_availability: ManualAvailability;
  publication_status: PublicationStatus;
  is_featured: boolean;
  has_variants: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductDetailDto extends ProductRow {
  category?: Pick<CategoryRow, 'id' | 'name' | 'slug'> | null;
  subcategory?: Pick<CategoryRow, 'id' | 'name' | 'slug'> | null;
  images: ProductImageRow[];
  variants: ProductVariantRow[];
  inventory: InventoryRow[];
}

export interface InventoryMovementRow {
  id: string;
  product_id: string;
  variant_id: string | null;
  movement_type: 'in' | 'out' | 'adjustment' | 'mode_switch';
  quantity_delta: number;
  previous_quantity: number;
  new_quantity: number;
  reason: string;
  created_by: string | null;
  created_at: string;
}

export interface OrderItemRow {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  product_name_snapshot: string;
  variant_name_snapshot: string | null;
  attributes_snapshot: Record<string, string>;
  quantity: number;
  unit_price_cup: number;
  subtotal_cup: number;
  created_at: string;
}

export interface OrderRow {
  id: string;
  store_id: string;
  reference_code: string;
  status: OrderStatus;
  delivery_mode: DeliveryModeType;
  customer_name: string;
  customer_phone: string | null;
  delivery_address: string | null;
  delivery_notes: string | null;
  estimated_total_cup: number;
  whatsapp_message_snapshot: string;
  confirmed_at: string | null;
  confirmed_by: string | null;
  created_at: string;
  updated_at: string;
  items?: OrderItemRow[];
}

export interface AuditLogRow {
  id: string;
  store_id: string | null;
  actor_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface DashboardStatsDto {
  totalProducts: number;
  publishedProducts: number;
  hiddenProducts: number;
  outOfStockProducts: number;
  categoriesCount: number;
  orderRequestsCount: number;
  confirmedOrdersCount: number;
  storageBytesUsed: number;
}
