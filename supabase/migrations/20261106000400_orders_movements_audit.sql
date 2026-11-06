-- =============================================================================
-- Migración 0004: Movimientos de Inventario, Solicitudes de Pedidos y Auditoría
-- Proyecto: PequeModas-Juguetería (StudioLexair)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL,
  movement_type text NOT NULL CHECK (
    movement_type IN ('in', 'out', 'adjustment', 'mode_switch')
  ),
  quantity_delta integer NOT NULL,
  previous_quantity integer NOT NULL CHECK (previous_quantity >= 0),
  new_quantity integer NOT NULL CHECK (new_quantity >= 0),
  reason text NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  reference_code text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'request_received' CHECK (
    status IN ('request_received', 'confirmed', 'cancelled', 'completed')
  ),
  delivery_mode text NOT NULL CHECK (delivery_mode IN ('delivery', 'pickup')),
  customer_name text NOT NULL,
  customer_phone text,
  delivery_address text,
  delivery_notes text,
  estimated_total_cup numeric(12, 2) NOT NULL DEFAULT 0 CHECK (estimated_total_cup >= 0),
  whatsapp_message_snapshot text NOT NULL,
  confirmed_at timestamptz,
  confirmed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL,
  product_name_snapshot text NOT NULL,
  variant_name_snapshot text,
  attributes_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  quantity integer NOT NULL CHECK (quantity > 0 AND quantity <= 999),
  unit_price_cup numeric(12, 2) NOT NULL CHECK (unit_price_cup >= 0),
  subtotal_cup numeric(12, 2) NOT NULL CHECK (subtotal_cup >= 0),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_inventory_movements_product_created
  ON public.inventory_movements (product_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_store_status_created
  ON public.orders (store_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id
  ON public.order_items (order_id);

CREATE INDEX IF NOT EXISTS idx_audit_logs_store_created
  ON public.audit_logs (store_id, created_at DESC);

DROP TRIGGER IF EXISTS trg_orders_updated_at ON public.orders;
CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
