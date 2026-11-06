-- =============================================================================
-- Migración 0006: Políticas estrictas de Row Level Security (RLS)
-- Proyecto: PequeModas-Juguetería (StudioLexair)
-- =============================================================================

ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. STORES
DROP POLICY IF EXISTS "stores_public_select" ON public.stores;
CREATE POLICY "stores_public_select" ON public.stores
  FOR SELECT USING (is_active = true OR public.is_store_admin());

DROP POLICY IF EXISTS "stores_admin_write" ON public.stores;
CREATE POLICY "stores_admin_write" ON public.stores
  FOR ALL TO authenticated
  USING (public.is_store_admin())
  WITH CHECK (public.is_store_admin());

-- 2. PROFILES (Sin registro público; solo lectura propia o admin)
DROP POLICY IF EXISTS "profiles_self_or_admin_select" ON public.profiles;
CREATE POLICY "profiles_self_or_admin_select" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_store_admin());

DROP POLICY IF EXISTS "profiles_admin_update" ON public.profiles;
CREATE POLICY "profiles_admin_update" ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.is_store_admin())
  WITH CHECK (public.is_store_admin());

-- 3. STORE_SETTINGS
DROP POLICY IF EXISTS "store_settings_public_select" ON public.store_settings;
CREATE POLICY "store_settings_public_select" ON public.store_settings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "store_settings_admin_write" ON public.store_settings;
CREATE POLICY "store_settings_admin_write" ON public.store_settings
  FOR ALL TO authenticated
  USING (public.is_store_admin())
  WITH CHECK (public.is_store_admin());

-- 4. CATEGORIES
DROP POLICY IF EXISTS "categories_public_select" ON public.categories;
CREATE POLICY "categories_public_select" ON public.categories
  FOR SELECT USING (
    (is_active = true AND is_archived = false) OR public.is_store_admin()
  );

DROP POLICY IF EXISTS "categories_admin_write" ON public.categories;
CREATE POLICY "categories_admin_write" ON public.categories
  FOR ALL TO authenticated
  USING (public.is_store_admin())
  WITH CHECK (public.is_store_admin());

-- 5. PRODUCTS (Público solo ve productos 'published')
DROP POLICY IF EXISTS "products_public_select" ON public.products;
CREATE POLICY "products_public_select" ON public.products
  FOR SELECT USING (
    publication_status = 'published' OR public.is_store_admin()
  );

DROP POLICY IF EXISTS "products_admin_write" ON public.products;
CREATE POLICY "products_admin_write" ON public.products
  FOR ALL TO authenticated
  USING (public.is_store_admin())
  WITH CHECK (public.is_store_admin());

-- 6. PRODUCT_IMAGES
DROP POLICY IF EXISTS "product_images_public_select" ON public.product_images;
CREATE POLICY "product_images_public_select" ON public.product_images
  FOR SELECT USING (
    public.is_store_admin()
    OR EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = product_images.product_id
        AND p.publication_status = 'published'
    )
  );

DROP POLICY IF EXISTS "product_images_admin_write" ON public.product_images;
CREATE POLICY "product_images_admin_write" ON public.product_images
  FOR ALL TO authenticated
  USING (public.is_store_admin())
  WITH CHECK (public.is_store_admin());

-- 7. PRODUCT_VARIANTS
DROP POLICY IF EXISTS "product_variants_public_select" ON public.product_variants;
CREATE POLICY "product_variants_public_select" ON public.product_variants
  FOR SELECT USING (
    public.is_store_admin()
    OR (
      is_active = true
      AND EXISTS (
        SELECT 1 FROM public.products p
        WHERE p.id = product_variants.product_id
          AND p.publication_status = 'published'
      )
    )
  );

DROP POLICY IF EXISTS "product_variants_admin_write" ON public.product_variants;
CREATE POLICY "product_variants_admin_write" ON public.product_variants
  FOR ALL TO authenticated
  USING (public.is_store_admin())
  WITH CHECK (public.is_store_admin());

-- 8. INVENTORY
DROP POLICY IF EXISTS "inventory_public_select" ON public.inventory;
CREATE POLICY "inventory_public_select" ON public.inventory
  FOR SELECT USING (
    public.is_store_admin()
    OR EXISTS (
      SELECT 1 FROM public.products p
      WHERE p.id = inventory.product_id
        AND p.publication_status = 'published'
    )
  );

DROP POLICY IF EXISTS "inventory_admin_write" ON public.inventory;
CREATE POLICY "inventory_admin_write" ON public.inventory
  FOR ALL TO authenticated
  USING (public.is_store_admin())
  WITH CHECK (public.is_store_admin());

-- 9. INVENTORY_MOVEMENTS (Privado administrativo)
DROP POLICY IF EXISTS "inventory_movements_admin_all" ON public.inventory_movements;
CREATE POLICY "inventory_movements_admin_all" ON public.inventory_movements
  FOR ALL TO authenticated
  USING (public.is_store_admin())
  WITH CHECK (public.is_store_admin());

-- 10. ORDERS & ORDER_ITEMS (Privado administrativo; alta pública vía RPC segura)
DROP POLICY IF EXISTS "orders_admin_all" ON public.orders;
CREATE POLICY "orders_admin_all" ON public.orders
  FOR ALL TO authenticated
  USING (public.is_store_admin())
  WITH CHECK (public.is_store_admin());

DROP POLICY IF EXISTS "order_items_admin_all" ON public.order_items;
CREATE POLICY "order_items_admin_all" ON public.order_items
  FOR ALL TO authenticated
  USING (public.is_store_admin())
  WITH CHECK (public.is_store_admin());

-- 11. AUDIT_LOGS (Solo lectura e inserción por administradora autenticada)
DROP POLICY IF EXISTS "audit_logs_admin_select" ON public.audit_logs;
CREATE POLICY "audit_logs_admin_select" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (public.is_store_admin());

DROP POLICY IF EXISTS "audit_logs_admin_insert" ON public.audit_logs;
CREATE POLICY "audit_logs_admin_insert" ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (public.is_store_admin());
