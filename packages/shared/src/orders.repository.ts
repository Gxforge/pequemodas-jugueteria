import type { DeliveryModeType, OrderStatus } from '@pequemodas/schemas';
import { resolveProductAvailability } from './availability';
import { fetchProductsPaginated } from './products-read.repository';
import { getSupabaseClient } from './supabase-client';
import type { AuditLogRow, DashboardStatsDto, OrderRow } from './types';

export interface CreateOrderRequestLine {
  product_id: string;
  variant_id: string | null;
  product_name: string;
  variant_name: string | null;
  attributes: Record<string, string>;
  quantity: number;
  unit_price_cup: number;
}

export async function submitWhatsAppOrderRequest(params: {
  deliveryMode: DeliveryModeType;
  customerName: string;
  customerPhone?: string;
  deliveryAddress?: string;
  deliveryNotes?: string;
  whatsappMessage: string;
  items: CreateOrderRequestLine[];
}): Promise<{ recorded: boolean; referenceCode: string | null }> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc('create_whatsapp_order_request', {
    p_delivery_mode: params.deliveryMode,
    p_customer_name: params.customerName,
    p_customer_phone: params.customerPhone ?? '',
    p_delivery_address: params.deliveryAddress ?? '',
    p_delivery_notes: params.deliveryNotes ?? '',
    p_whatsapp_message: params.whatsappMessage,
    p_items: params.items
  });

  if (error) {
    return { recorded: false, referenceCode: null };
  }

  const res = data as { recorded?: boolean; reference_code?: string | null } | null;
  return {
    recorded: Boolean(res?.recorded),
    referenceCode: res?.reference_code ?? null
  };
}

export async function fetchOrdersForAdmin(statusFilter?: OrderStatus | 'all'): Promise<OrderRow[]> {
  const supabase = getSupabaseClient();
  let query = supabase
    .from('orders')
    .select('*, items:order_items(*)')
    .order('created_at', { ascending: false })
    .limit(100);

  if (statusFilter && statusFilter !== 'all') {
    query = query.eq('status', statusFilter);
  }

  const { data, error } = await query;
  if (error) throw new Error(`Error al cargar solicitudes de pedidos: ${error.message}`);
  return (data ?? []) as OrderRow[];
}

export async function updateOrderStatusByAdmin(
  orderId: string,
  storeId: string,
  status: OrderStatus
): Promise<void> {
  const supabase = getSupabaseClient();
  const patch: Record<string, unknown> = { status };
  if (status === 'confirmed') {
    patch.confirmed_at = new Date().toISOString();
  }

  const { error } = await supabase.from('orders').update(patch).eq('id', orderId);
  if (error) throw new Error(`No se pudo actualizar el estado del pedido: ${error.message}`);

  await supabase.from('audit_logs').insert({
    store_id: storeId,
    action: `order.status.${status}`,
    entity_type: 'order',
    entity_id: orderId,
    metadata: { status }
  });
}

export async function fetchDashboardStats(): Promise<{
  stats: DashboardStatsDto;
  recentActivity: AuditLogRow[];
}> {
  const supabase = getSupabaseClient();

  const [allProducts, categoriesRes, ordersRes, imagesRes, logsRes] = await Promise.all([
    fetchProductsPaginated({ publicationStatus: 'all', page: 1, pageSize: 500 }),
    supabase.from('categories').select('id', { count: 'exact', head: true }).eq('is_archived', false),
    supabase.from('orders').select('status'),
    supabase.from('product_images').select('size_bytes'),
    supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)
  ]);

  const activeProducts = allProducts.items.filter((p) => p.publication_status !== 'archived');
  const publishedProducts = activeProducts.filter(
    (p) => p.publication_status === 'published'
  ).length;
  const hiddenProducts = activeProducts.filter(
    (p) => p.publication_status === 'hidden' || p.publication_status === 'draft'
  ).length;
  const outOfStockProducts = activeProducts.filter(
    (p) => resolveProductAvailability(p).status === 'out_of_stock'
  ).length;

  const orderRows = (ordersRes.data ?? []) as Array<{ status: OrderStatus }>;
  const orderRequestsCount = orderRows.filter((o) => o.status === 'request_received').length;
  const confirmedOrdersCount = orderRows.filter(
    (o) => o.status === 'confirmed' || o.status === 'completed'
  ).length;

  const storageBytesUsed = ((imagesRes.data ?? []) as Array<{ size_bytes: number }>).reduce(
    (acc, r) => acc + (r.size_bytes ?? 0),
    0
  );

  return {
    stats: {
      totalProducts: activeProducts.length,
      publishedProducts,
      hiddenProducts,
      outOfStockProducts,
      categoriesCount: categoriesRes.count ?? 0,
      orderRequestsCount,
      confirmedOrdersCount,
      storageBytesUsed
    },
    recentActivity: (logsRes.data ?? []) as AuditLogRow[]
  };
}
