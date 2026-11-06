-- =============================================================================
-- Proyecto 2 (pequemodas-jugueteria-chat): Pedidos Directos en App,
-- Señales Anti-Spam de Carrito y Métricas de Base de Datos
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
BEGIN
  IF jsonb_typeof(p_items) <> 'array' OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'El carrito está vacío.';
  END IF;

  v_contact_json := public.open_or_update_customer_contact(
    p_customer_token, p_full_name, p_phone, p_delivery_address
  );
  v_contact_id := (v_contact_json->>'contact_id')::uuid;
  v_token := (v_contact_json->>'customer_token')::uuid;
  v_ref := 'APP-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
  v_items_count := jsonb_array_length(p_items);

  INSERT INTO public.direct_orders (
    reference_code,
    contact_id,
    delivery_mode,
    delivery_address,
    delivery_notes,
    items,
    estimated_total_cup,
    status
  ) VALUES (
    v_ref,
    v_contact_id,
    CASE WHEN p_delivery_mode = 'pickup' THEN 'pickup' ELSE 'delivery' END,
    NULLIF(btrim(COALESCE(p_delivery_address, '')), ''),
    NULLIF(btrim(COALESCE(p_delivery_notes, '')), ''),
    p_items,
    GREATEST(0, COALESCE(p_estimated_total_cup, 0)),
    'pending'
  )
  RETURNING * INTO v_order;

  v_summary := format(
    '🛍️ Pedido directo #%s (%s artículos · %s CUP) · %s',
    v_ref,
    v_items_count,
    round(v_order.estimated_total_cup, 2),
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
      '%s artículos por %s CUP. Confirma con el cliente en el chat y actualiza el stock.',
      v_items_count,
      round(v_order.estimated_total_cup, 2)
    ),
    v_contact_id,
    v_order.id,
    'order:' || v_order.id::text,
    false
  );

  RETURN jsonb_build_object(
    'order_id', v_order.id,
    'reference_code', v_ref,
    'customer_token', v_token,
    'contact_id', v_contact_id
  );
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
DECLARE
  v_bot public.bot_config%ROWTYPE;
  v_clean_session text := left(regexp_replace(COALESCE(p_session_key, 'anon'), '[^a-zA-Z0-9_-]', '', 'g'), 48);
  v_bucket bigint;
  v_dedupe text;
BEGIN
  SELECT * INTO v_bot FROM public.bot_config WHERE id = 1;
  IF NOT v_bot.notify_on_cart_add THEN
    RETURN jsonb_build_object('recorded', false, 'reason', 'muted');
  END IF;

  -- Ventana anti-spam configurable (por defecto 30 min por sesión de cliente)
  v_bucket := floor(extract(epoch FROM timezone('utc', now())) / (GREATEST(5, v_bot.cart_cooldown_minutes) * 60));
  v_dedupe := 'cart:' || v_clean_session || ':' || v_bucket::text;

  INSERT INTO public.admin_notifications (
    kind, title, body, dedupe_key, event_count, is_read
  ) VALUES (
    'cart_activity',
    'Cliente armando carrito en vivo',
    format(
      'Agregó "%s" (%s artículos · %s CUP). Atenta por si envía pedido para confirmar compra y stock.',
      left(COALESCE(p_product_name, 'Producto'), 70),
      GREATEST(1, COALESCE(p_cart_count, 1)),
      round(GREATEST(0, COALESCE(p_estimated_cup, 0)), 2)
    ),
    v_dedupe,
    1,
    false
  )
  ON CONFLICT (dedupe_key) DO UPDATE
  SET body = format(
        'Sigue armando su carrito: última adición "%s" (%s artículos · %s CUP). Recuerda confirmar compra y stock si solicita pedido.',
        left(COALESCE(p_product_name, 'Producto'), 70),
        GREATEST(1, COALESCE(p_cart_count, 1)),
        round(GREATEST(0, COALESCE(p_estimated_cup, 0)), 2)
      ),
      event_count = public.admin_notifications.event_count + 1,
      updated_at = timezone('utc', now());

  RETURN jsonb_build_object('recorded', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_crm_storage_overview()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_db_bytes bigint := 0;
  v_contacts bigint := 0;
  v_orders bigint := 0;
  v_pending_orders bigint := 0;
  v_unread_chats bigint := 0;
  v_unread_notifs bigint := 0;
  v_messages bigint := 0;
BEGIN
  SELECT pg_database_size(current_database()) INTO v_db_bytes;
  SELECT count(*) INTO v_contacts FROM public.customer_contacts;
  SELECT count(*) INTO v_orders FROM public.direct_orders;
  SELECT count(*) INTO v_pending_orders FROM public.direct_orders WHERE status = 'pending';
  SELECT count(*) INTO v_unread_chats FROM public.customer_contacts WHERE unread_for_admin > 0;
  SELECT count(*) INTO v_unread_notifs FROM public.admin_notifications WHERE is_read = false;
  SELECT count(*) INTO v_messages FROM public.chat_messages;

  RETURN jsonb_build_object(
    'dbBytesUsed', v_db_bytes,
    'dbQuotaBytes', 524288000,
    'contactsCount', v_contacts,
    'directOrdersCount', v_orders,
    'pendingOrdersCount', v_pending_orders,
    'unreadChatsCount', v_unread_chats,
    'unreadNotificationsCount', v_unread_notifs,
    'messagesCount', v_messages
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.open_or_update_customer_contact(uuid, text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.fetch_customer_thread(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.send_customer_message(uuid, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_direct_app_order(uuid, text, text, text, text, text, jsonb, numeric) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_cart_activity_signal(text, text, integer, numeric) TO anon, authenticated;
