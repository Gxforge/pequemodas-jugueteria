-- =============================================================================
-- Migración Chat 0005b: Pedidos directos y avisos con totales CUP / USD
-- Requiere 000500_currency_helpers.sql. Se aplica en AMBOS proyectos.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.submit_direct_app_order(
  p_customer_token uuid,
  p_full_name text,
  p_phone text,
  p_delivery_mode text,
  p_delivery_address text,
  p_delivery_notes text,
  p_items jsonb,
  p_estimated_total_cup numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_contact_json jsonb;
  v_contact_id uuid;
  v_token uuid;
  v_ref text;
  v_order public.direct_orders%ROWTYPE;
  v_bot public.bot_config%ROWTYPE;
  v_summary text;
  v_items_count integer;
  v_totals jsonb;
  v_totals_text text;
  v_cup_total numeric;
BEGIN
  IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'El carrito está vacío.';
  END IF;

  v_totals := public.build_currency_totals(p_items);
  IF v_totals = '{}'::jsonb THEN
    v_totals := jsonb_build_object('CUP', GREATEST(0, COALESCE(p_estimated_total_cup, 0)));
  END IF;
  v_cup_total := COALESCE((v_totals->>'CUP')::numeric, 0);
  v_totals_text := public.format_currency_totals(v_totals);

  v_contact_json := public.open_or_update_customer_contact(
    p_customer_token, p_full_name, p_phone, p_delivery_address
  );
  v_contact_id := (v_contact_json->>'contact_id')::uuid;
  v_token := (v_contact_json->>'customer_token')::uuid;
  v_ref := 'APP-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
  v_items_count := jsonb_array_length(p_items);

  INSERT INTO public.direct_orders (
    reference_code, contact_id, delivery_mode,
    delivery_address, delivery_notes, items,
    estimated_total_cup, totals_by_currency, status
  ) VALUES (
    v_ref, v_contact_id,
    CASE WHEN p_delivery_mode = 'pickup' THEN 'pickup' ELSE 'delivery' END,
    NULLIF(btrim(COALESCE(p_delivery_address, '')), ''),
    NULLIF(btrim(COALESCE(p_delivery_notes, '')), ''),
    p_items, v_cup_total, v_totals, 'pending'
  )
  RETURNING * INTO v_order;

  v_summary := format(
    '🛍️ Pedido directo #%s (%s artículos · %s) · %s',
    v_ref, v_items_count, v_totals_text,
    CASE WHEN v_order.delivery_mode = 'pickup' THEN 'Recogida' ELSE 'Entrega a domicilio' END
  );

  INSERT INTO public.chat_messages (
    contact_id, sender_role, sender_name, body, order_id
  ) VALUES (
    v_contact_id, 'customer', btrim(p_full_name), v_summary, v_order.id
  );

  SELECT * INTO v_bot FROM public.bot_config WHERE id = 1;
  IF v_bot.is_enabled THEN
    INSERT INTO public.chat_messages (
      contact_id, sender_role, sender_name, body, order_id
    ) VALUES (
      v_contact_id, 'bot', v_bot.bot_name, v_bot.order_received_message, v_order.id
    );
  END IF;

  UPDATE public.customer_contacts
  SET unread_for_admin = unread_for_admin + 1,
      last_message_preview = v_summary,
      last_message_at = timezone('utc', now()),
      updated_at = timezone('utc', now())
  WHERE id = v_contact_id;

  INSERT INTO public.admin_notifications (
    kind, title, body, contact_id, order_id, dedupe_key, is_read
  ) VALUES (
    'direct_order',
    format('Nueva compra en la app (%s) de %s', v_ref, btrim(p_full_name)),
    format(
      '%s artículos por %s. Confirma con el cliente en el chat y actualiza el stock.',
      v_items_count, v_totals_text
    ),
    v_contact_id, v_order.id, 'order:' || v_order.id::text, false
  );

  RETURN jsonb_build_object(
    'order_id', v_order.id,
    'reference_code', v_ref,
    'customer_token', v_token,
    'contact_id', v_contact_id
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.record_cart_activity_signal_v2(
  p_session_key text,
  p_product_name text,
  p_cart_count integer,
  p_estimated_cup numeric,
  p_totals_by_currency jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_bot public.bot_config%ROWTYPE;
  v_clean_session text := left(regexp_replace(COALESCE(p_session_key, 'anon'), '[^a-zA-Z0-9_-]', '', 'g'), 48);
  v_bucket bigint;
  v_dedupe text;
  v_totals jsonb;
  v_totals_text text;
BEGIN
  SELECT * INTO v_bot FROM public.bot_config WHERE id = 1;
  IF NOT FOUND OR NOT COALESCE(v_bot.is_enabled, false) THEN
    RETURN jsonb_build_object('recorded', false, 'reason', 'muted');
  END IF;

  v_totals := CASE
    WHEN public.is_valid_currency_totals(p_totals_by_currency)
      AND p_totals_by_currency <> '{}'::jsonb
      THEN p_totals_by_currency
    ELSE jsonb_build_object('CUP', GREATEST(0, COALESCE(p_estimated_cup, 0)))
  END;
  v_totals_text := public.format_currency_totals(v_totals);
  v_bucket := floor(
    extract(epoch FROM timezone('utc', now())) /
    (GREATEST(5, COALESCE(v_bot.cart_cooldown_minutes, 30)) * 60)
  );
  v_dedupe := 'cart:' || v_clean_session || ':' || v_bucket::text;

  INSERT INTO public.admin_notifications (
    kind, title, body, dedupe_key, event_count, is_read
  ) VALUES (
    'cart_activity',
    'Cliente armando carrito en vivo',
    format(
      'Agregó "%s" (%s artículos · %s). Atenta por si envía pedido para confirmar compra y stock.',
      left(COALESCE(p_product_name, 'Producto'), 70),
      GREATEST(1, COALESCE(p_cart_count, 1)),
      v_totals_text
    ),
    v_dedupe, 1, false
  )
  ON CONFLICT (dedupe_key) DO UPDATE
  SET body = format(
        'Sigue armando su carrito: última adición "%s" (%s artículos · %s). Recuerda confirmar compra y stock si solicita pedido.',
        left(COALESCE(p_product_name, 'Producto'), 70),
        GREATEST(1, COALESCE(p_cart_count, 1)),
        v_totals_text
      ),
      event_count = public.admin_notifications.event_count + 1,
      updated_at = timezone('utc', now());

  RETURN jsonb_build_object('recorded', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.record_cart_activity_signal(
  p_session_key text,
  p_product_name text,
  p_cart_count integer,
  p_estimated_cup numeric
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN public.record_cart_activity_signal_v2(
    p_session_key,
    p_product_name,
    p_cart_count,
    p_estimated_cup,
    jsonb_build_object('CUP', GREATEST(0, COALESCE(p_estimated_cup, 0)))
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_direct_app_order(uuid, text, text, text, text, text, jsonb, numeric) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_cart_activity_signal_v2(text, text, integer, numeric, jsonb) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_cart_activity_signal(text, text, integer, numeric) TO anon, authenticated;
