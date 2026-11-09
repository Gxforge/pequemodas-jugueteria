-- =============================================================================
-- Migración 0012: Moneda configurable por producto y moneda principal de tienda
-- Proyecto: PequeModas-Juguetería (StudioLexair)
-- CUP y USD se administran por separado: NO hay conversión de moneda.
-- =============================================================================

ALTER TABLE public.store_settings
  ADD COLUMN IF NOT EXISTS default_currency_code text NOT NULL DEFAULT 'CUP';
ALTER TABLE public.store_settings
  DROP CONSTRAINT IF EXISTS chk_store_settings_default_currency;
ALTER TABLE public.store_settings
  ADD CONSTRAINT chk_store_settings_default_currency
  CHECK (default_currency_code IN ('CUP', 'USD'));

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS currency_code text NOT NULL DEFAULT 'CUP';
ALTER TABLE public.products
  DROP CONSTRAINT IF EXISTS chk_products_currency_code;
ALTER TABLE public.products
  ADD CONSTRAINT chk_products_currency_code
  CHECK (currency_code IN ('CUP', 'USD'));

ALTER TABLE public.order_items
  ADD COLUMN IF NOT EXISTS currency_code text NOT NULL DEFAULT 'CUP';
ALTER TABLE public.order_items
  DROP CONSTRAINT IF EXISTS chk_order_items_currency_code;
ALTER TABLE public.order_items
  ADD CONSTRAINT chk_order_items_currency_code
  CHECK (currency_code IN ('CUP', 'USD'));

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS totals_by_currency jsonb NOT NULL DEFAULT '{}'::jsonb;

CREATE OR REPLACE FUNCTION public.is_valid_currency_totals(p_totals jsonb)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT p_totals IS NOT NULL
    AND jsonb_typeof(p_totals) = 'object'
    AND NOT EXISTS (
      SELECT 1
      FROM jsonb_each(p_totals) AS e(key, value)
      WHERE e.key NOT IN ('CUP', 'USD')
        OR jsonb_typeof(e.value) <> 'number'
        OR (e.value::text)::numeric < 0
    );
$$;

ALTER TABLE public.orders
  DROP CONSTRAINT IF EXISTS chk_orders_totals_currency;
ALTER TABLE public.orders
  ADD CONSTRAINT chk_orders_totals_currency
  CHECK (public.is_valid_currency_totals(totals_by_currency));

UPDATE public.orders
SET totals_by_currency = jsonb_build_object('CUP', estimated_total_cup)
WHERE totals_by_currency = '{}'::jsonb OR totals_by_currency IS NULL;

COMMENT ON COLUMN public.products.base_price_cup IS
  'Importe numérico histórico; la moneda real está en currency_code.';
COMMENT ON COLUMN public.product_variants.price_override_cup IS
  'Importe numérico histórico; usa la moneda del producto padre.';
COMMENT ON COLUMN public.order_items.unit_price_cup IS
  'Importe numérico histórico; la moneda real está en currency_code.';
COMMENT ON COLUMN public.orders.estimated_total_cup IS
  'Subtotal exclusivo en CUP; el desglose completo está en totals_by_currency.';

CREATE OR REPLACE FUNCTION public.build_currency_totals(p_items jsonb)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  v_item jsonb;
  v_qty numeric;
  v_price numeric;
  v_currency text;
  v_total_cup numeric := 0;
  v_total_usd numeric := 0;
BEGIN
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' THEN
    RAISE EXCEPTION 'Los artículos del pedido deben ser una lista.';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_qty := COALESCE(NULLIF(v_item->>'quantity', '')::numeric, 0);
    v_price := COALESCE(
      NULLIF(v_item->>'unit_price', ''),
      NULLIF(v_item->>'unit_price_cup', ''),
      '0'
    )::numeric;
    v_currency := upper(COALESCE(NULLIF(v_item->>'currency_code', ''), 'CUP'));

    IF v_qty <= 0 OR v_qty > 999 OR v_price < 0 THEN
      RAISE EXCEPTION 'Datos de línea de pedido inválidos.';
    END IF;
    IF v_currency NOT IN ('CUP', 'USD') THEN
      RAISE EXCEPTION 'Moneda de pedido no permitida.';
    END IF;

    IF v_currency = 'CUP' THEN
      v_total_cup := v_total_cup + round(v_price * v_qty, 2);
    ELSE
      v_total_usd := v_total_usd + round(v_price * v_qty, 2);
    END IF;
  END LOOP;

  RETURN jsonb_strip_nulls(jsonb_build_object(
    'CUP', CASE WHEN v_total_cup > 0 THEN round(v_total_cup, 2) ELSE NULL END,
    'USD', CASE WHEN v_total_usd > 0 THEN round(v_total_usd, 2) ELSE NULL END
  ));
END;
$$;

CREATE OR REPLACE FUNCTION public.format_currency_totals(p_totals jsonb)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    string_agg(
      format(
        '%s %s',
        replace(to_char((e.value::text)::numeric, 'FM9999999990.00'), '.', ','),
        e.key
      ),
      ' + ' ORDER BY CASE e.key WHEN 'CUP' THEN 1 WHEN 'USD' THEN 2 ELSE 3 END
    ),
    '0,00 CUP'
  )
  FROM jsonb_each(COALESCE(p_totals, '{}'::jsonb)) AS e(key, value)
  WHERE e.key IN ('CUP', 'USD')
    AND jsonb_typeof(e.value) = 'number'
    AND (e.value::text)::numeric > 0;
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
  v_totals jsonb;
  v_total_cup numeric;
  v_item jsonb;
  v_qty integer;
  v_unit_price numeric;
  v_subtotal numeric;
  v_currency text;
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

  SELECT count(*) INTO v_recent_count
  FROM public.orders
  WHERE store_id = v_store_id
    AND created_at > timezone('utc', now()) - interval '1 minute';
  IF v_recent_count >= 25 THEN
    RAISE EXCEPTION 'Demasiadas solicitudes recientes. Intenta nuevamente en un minuto.';
  END IF;

  IF p_delivery_mode NOT IN ('delivery', 'pickup') THEN
    RAISE EXCEPTION 'Modalidad de entrega inválida.';
  END IF;
  IF length(btrim(COALESCE(p_customer_name, ''))) < 2 THEN
    RAISE EXCEPTION 'Indica el nombre del cliente.';
  END IF;
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'La solicitud debe incluir al menos un producto.';
  END IF;

  v_totals := public.build_currency_totals(p_items);
  v_total_cup := COALESCE((v_totals->>'CUP')::numeric, 0);
  v_ref := 'PM-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));

  -- status = 'request_received': NO descuenta inventario ni reserva stock.
  INSERT INTO public.orders (
    store_id, reference_code, status, delivery_mode,
    customer_name, customer_phone, delivery_address, delivery_notes,
    estimated_total_cup, totals_by_currency, whatsapp_message_snapshot
  )
  VALUES (
    v_store_id, v_ref, 'request_received', p_delivery_mode,
    left(btrim(p_customer_name), 100),
    nullif(left(trim(COALESCE(p_customer_phone, '')), 30), ''),
    nullif(left(trim(COALESCE(p_delivery_address, '')), 300), ''),
    nullif(left(trim(COALESCE(p_delivery_notes, '')), 400), ''),
    v_total_cup,
    v_totals,
    left(COALESCE(p_whatsapp_message, ''), 4000)
  )
  RETURNING id INTO v_order_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_qty := COALESCE(NULLIF(v_item->>'quantity', '')::integer, 0);
    v_unit_price := COALESCE(
      NULLIF(v_item->>'unit_price', ''),
      NULLIF(v_item->>'unit_price_cup', ''),
      '0'
    )::numeric;
    v_subtotal := round(v_unit_price * v_qty, 2);
    v_currency := upper(COALESCE(NULLIF(v_item->>'currency_code', ''), 'CUP'));

    INSERT INTO public.order_items (
      order_id, product_id, variant_id,
      product_name_snapshot, variant_name_snapshot, attributes_snapshot,
      quantity, unit_price_cup, subtotal_cup, currency_code
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
      v_subtotal,
      v_currency
    );
  END LOOP;

  RETURN jsonb_build_object(
    'recorded', true,
    'order_id', v_order_id,
    'reference_code', v_ref
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_whatsapp_order_request(text, text, text, text, text, text, jsonb) TO anon, authenticated;
