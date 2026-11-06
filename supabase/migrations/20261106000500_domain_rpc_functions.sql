-- =============================================================================
-- Migración 0005: Funciones Seguras de Dominio (Auth, Inventario Atómico y Pedidos)
-- Proyecto: PequeModas-Juguetería (StudioLexair)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.is_store_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.is_active = true
      AND p.role IN ('owner', 'admin')
  );
$$;

CREATE OR REPLACE FUNCTION public.record_inventory_movement(
  p_product_id uuid,
  p_variant_id uuid,
  p_movement_type text,
  p_quantity integer,
  p_reason text
)
RETURNS public.inventory_movements
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inv public.inventory;
  v_prev integer := 0;
  v_next integer := 0;
  v_delta integer := 0;
  v_mov public.inventory_movements;
  v_store_id uuid;
BEGIN
  IF NOT public.is_store_admin() THEN
    RAISE EXCEPTION 'Acceso denegado: se requieren permisos administrativos.';
  END IF;

  IF p_quantity < 0 THEN
    RAISE EXCEPTION 'La cantidad no puede ser negativa.';
  END IF;

  SELECT store_id INTO v_store_id FROM public.products WHERE id = p_product_id;
  IF v_store_id IS NULL THEN
    RAISE EXCEPTION 'Producto no encontrado.';
  END IF;

  IF p_variant_id IS NULL THEN
    SELECT * INTO v_inv
    FROM public.inventory
    WHERE product_id = p_product_id AND variant_id IS NULL
    FOR UPDATE;
  ELSE
    SELECT * INTO v_inv
    FROM public.inventory
    WHERE product_id = p_product_id AND variant_id = p_variant_id
    FOR UPDATE;
  END IF;

  IF v_inv.id IS NULL THEN
    INSERT INTO public.inventory (product_id, variant_id, quantity)
    VALUES (p_product_id, p_variant_id, 0)
    RETURNING * INTO v_inv;
  END IF;

  v_prev := v_inv.quantity;

  IF p_movement_type = 'in' THEN
    v_next := v_prev + p_quantity;
    v_delta := p_quantity;
  ELSIF p_movement_type = 'out' THEN
    v_next := v_prev - p_quantity;
    v_delta := -p_quantity;
  ELSIF p_movement_type = 'adjustment' THEN
    v_next := p_quantity;
    v_delta := v_next - v_prev;
  ELSE
    RAISE EXCEPTION 'Tipo de movimiento inválido: %', p_movement_type;
  END IF;

  IF v_next < 0 THEN
    RAISE EXCEPTION 'Operación bloqueada: el inventario resultante (%) sería negativo.', v_next;
  END IF;

  UPDATE public.inventory
  SET quantity = v_next
  WHERE id = v_inv.id;

  INSERT INTO public.inventory_movements (
    product_id, variant_id, movement_type, quantity_delta,
    previous_quantity, new_quantity, reason, created_by
  )
  VALUES (
    p_product_id, p_variant_id, p_movement_type, v_delta,
    v_prev, v_next, trim(p_reason), auth.uid()
  )
  RETURNING * INTO v_mov;

  INSERT INTO public.audit_logs (store_id, actor_id, action, entity_type, entity_id, metadata)
  VALUES (
    v_store_id,
    auth.uid(),
    'inventory.' || p_movement_type,
    'product',
    p_product_id::text,
    jsonb_build_object(
      'variant_id', p_variant_id,
      'previous_quantity', v_prev,
      'new_quantity', v_next,
      'reason', trim(p_reason)
    )
  );

  RETURN v_mov;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_whatsapp_order_request(
  p_delivery_mode text,
  p_customer_name text,
  p_customer_phone text,
  p_delivery_address text,
  p_delivery_notes text,
  p_whatsapp_message text,
  p_items jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_store_id uuid;
  v_record_enabled boolean;
  v_recent_count integer;
  v_order_id uuid;
  v_ref text;
  v_total numeric(12, 2) := 0;
  v_item jsonb;
  v_qty integer;
  v_unit_price numeric(12, 2);
  v_subtotal numeric(12, 2);
BEGIN
  SELECT s.id, st.record_whatsapp_requests
  INTO v_store_id, v_record_enabled
  FROM public.stores s
  JOIN public.store_settings st ON st.store_id = s.id
  WHERE s.is_active = true
  LIMIT 1;

  IF v_store_id IS NULL OR NOT COALESCE(v_record_enabled, false) THEN
    RETURN jsonb_build_object('recorded', false, 'reference_code', NULL);
  END IF;

  -- Rate limiting básico en BD: máximo 25 solicitudes por minuto global
  SELECT count(*) INTO v_recent_count
  FROM public.orders
  WHERE store_id = v_store_id
    AND created_at > timezone('utc', now()) - interval '1 minute';

  IF v_recent_count >= 25 THEN
    RAISE EXCEPTION 'Demasiadas solicitudes recientes. Intenta nuevamente en un minuto.';
  END IF;

  IF jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'La solicitud debe incluir al menos un producto.';
  END IF;

  v_ref := 'PM-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_qty := (v_item->>'quantity')::integer;
    v_unit_price := (v_item->>'unit_price_cup')::numeric(12, 2);
    IF v_qty <= 0 OR v_qty > 999 OR v_unit_price < 0 THEN
      RAISE EXCEPTION 'Datos de línea de pedido inválidos.';
    END IF;
    v_total := v_total + round(v_unit_price * v_qty, 2);
  END LOOP;

  -- IMPORTANTE: status = 'request_received' (NO descuenta inventario ni reserva stock)
  INSERT INTO public.orders (
    store_id, reference_code, status, delivery_mode,
    customer_name, customer_phone, delivery_address, delivery_notes,
    estimated_total_cup, whatsapp_message_snapshot
  )
  VALUES (
    v_store_id, v_ref, 'request_received', p_delivery_mode,
    left(trim(p_customer_name), 100),
    nullif(left(trim(COALESCE(p_customer_phone, '')), 30), ''),
    nullif(left(trim(COALESCE(p_delivery_address, '')), 300), ''),
    nullif(left(trim(COALESCE(p_delivery_notes, '')), 400), ''),
    v_total,
    left(p_whatsapp_message, 4000)
  )
  RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_qty := (v_item->>'quantity')::integer;
    v_unit_price := (v_item->>'unit_price_cup')::numeric(12, 2);
    v_subtotal := round(v_unit_price * v_qty, 2);

    INSERT INTO public.order_items (
      order_id,
      product_id,
      variant_id,
      product_name_snapshot,
      variant_name_snapshot,
      attributes_snapshot,
      quantity,
      unit_price_cup,
      subtotal_cup
    )
    VALUES (
      v_order_id,
      NULLIF(v_item->>'product_id', '')::uuid,
      NULLIF(v_item->>'variant_id', '')::uuid,
      left(COALESCE(v_item->>'product_name', 'Producto'), 160),
      NULLIF(left(COALESCE(v_item->>'variant_name', ''), 120), ''),
      COALESCE(v_item->'attributes', '{}'::jsonb),
      v_qty,
      v_unit_price,
      v_subtotal
    );
  END LOOP;

  RETURN jsonb_build_object(
    'recorded', true,
    'order_id', v_order_id,
    'reference_code', v_ref
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_store_admin() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_inventory_movement(uuid, uuid, text, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_whatsapp_order_request(text, text, text, text, text, text, jsonb) TO anon, authenticated;
