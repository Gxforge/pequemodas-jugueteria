-- =============================================================================
-- Proyecto 2 (pequemodas-jugueteria-chat): RPCs Seguros para Clientes,
-- Motor Bot Configurable y Gestor Anti-Spam de Notificaciones
-- =============================================================================

CREATE OR REPLACE FUNCTION public.open_or_update_customer_contact(
  p_customer_token uuid,
  p_full_name text,
  p_phone text,
  p_address text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token uuid := COALESCE(p_customer_token, gen_random_uuid());
  v_name text := btrim(COALESCE(p_full_name, ''));
  v_phone text := btrim(COALESCE(p_phone, ''));
  v_addr text := NULLIF(btrim(COALESCE(p_address, '')), '');
  v_contact public.customer_contacts%ROWTYPE;
  v_bot public.bot_config%ROWTYPE;
  v_is_new boolean := false;
BEGIN
  IF char_length(v_name) < 2 THEN
    RAISE EXCEPTION 'Por favor ingresa tu nombre.';
  END IF;
  IF char_length(v_phone) < 6 THEN
    RAISE EXCEPTION 'Por favor ingresa un teléfono válido.';
  END IF;

  SELECT * INTO v_contact
  FROM public.customer_contacts
  WHERE customer_token = v_token;

  IF NOT FOUND THEN
    v_is_new := true;
    INSERT INTO public.customer_contacts (
      customer_token, full_name, phone, municipality_or_address, last_message_preview
    ) VALUES (
      v_token, v_name, v_phone, v_addr, 'Conversación iniciada'
    )
    RETURNING * INTO v_contact;

    SELECT * INTO v_bot FROM public.bot_config WHERE id = 1;
    IF v_bot.is_enabled THEN
      INSERT INTO public.chat_messages (
        contact_id, sender_role, sender_name, body
      ) VALUES (
        v_contact.id, 'bot', v_bot.bot_name, v_bot.welcome_message
      );
      UPDATE public.customer_contacts
      SET last_message_preview = v_bot.welcome_message
      WHERE id = v_contact.id;
    END IF;
  ELSE
    UPDATE public.customer_contacts
    SET full_name = v_name,
        phone = v_phone,
        municipality_or_address = COALESCE(v_addr, municipality_or_address),
        updated_at = timezone('utc', now())
    WHERE id = v_contact.id
    RETURNING * INTO v_contact;
  END IF;

  RETURN jsonb_build_object(
    'contact_id', v_contact.id,
    'customer_token', v_contact.customer_token,
    'full_name', v_contact.full_name,
    'phone', v_contact.phone,
    'municipality_or_address', v_contact.municipality_or_address,
    'is_new', v_is_new
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.fetch_customer_thread(p_customer_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_contact public.customer_contacts%ROWTYPE;
  v_messages jsonb;
  v_orders jsonb;
BEGIN
  IF p_customer_token IS NULL THEN
    RETURN jsonb_build_object('contact', NULL, 'messages', '[]'::jsonb, 'orders', '[]'::jsonb);
  END IF;

  SELECT * INTO v_contact
  FROM public.customer_contacts
  WHERE customer_token = p_customer_token;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('contact', NULL, 'messages', '[]'::jsonb, 'orders', '[]'::jsonb);
  END IF;

  IF v_contact.unread_for_customer > 0 THEN
    UPDATE public.customer_contacts
    SET unread_for_customer = 0
    WHERE id = v_contact.id;
  END IF;

  SELECT COALESCE(jsonb_agg(row_to_json(m) ORDER BY m.created_at ASC), '[]'::jsonb)
  INTO v_messages
  FROM (
    SELECT id, sender_role, sender_name, body, order_id, created_at
    FROM public.chat_messages
    WHERE contact_id = v_contact.id
    ORDER BY created_at ASC
    LIMIT 150
  ) m;

  SELECT COALESCE(jsonb_agg(row_to_json(o) ORDER BY o.created_at DESC), '[]'::jsonb)
  INTO v_orders
  FROM (
    SELECT id, reference_code, delivery_mode, estimated_total_cup, status, created_at
    FROM public.direct_orders
    WHERE contact_id = v_contact.id
    ORDER BY created_at DESC
    LIMIT 20
  ) o;

  RETURN jsonb_build_object(
    'contact', jsonb_build_object(
      'id', v_contact.id,
      'full_name', v_contact.full_name,
      'phone', v_contact.phone,
      'municipality_or_address', v_contact.municipality_or_address
    ),
    'messages', v_messages,
    'orders', v_orders
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.send_customer_message(
  p_customer_token uuid,
  p_body text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_contact public.customer_contacts%ROWTYPE;
  v_bot public.bot_config%ROWTYPE;
  v_clean text := btrim(COALESCE(p_body, ''));
  v_lower text;
  v_rule jsonb;
  v_kw text;
  v_bot_reply text := NULL;
  v_recent_bot_count integer := 0;
  v_dedupe text;
BEGIN
  IF char_length(v_clean) < 1 OR char_length(v_clean) > 1500 THEN
    RAISE EXCEPTION 'El mensaje debe tener entre 1 y 1500 caracteres.';
  END IF;

  SELECT * INTO v_contact
  FROM public.customer_contacts
  WHERE customer_token = p_customer_token;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Primero indica tu nombre y teléfono para iniciar el chat.';
  END IF;

  INSERT INTO public.chat_messages (
    contact_id, sender_role, sender_name, body
  ) VALUES (
    v_contact.id, 'customer', v_contact.full_name, v_clean
  );

  UPDATE public.customer_contacts
  SET unread_for_admin = unread_for_admin + 1,
      last_message_preview = left(v_clean, 120),
      last_message_at = timezone('utc', now()),
      updated_at = timezone('utc', now())
  WHERE id = v_contact.id;

  SELECT * INTO v_bot FROM public.bot_config WHERE id = 1;

  -- Notificación agrupada anti-spam por contacto
  IF v_bot.notify_on_chat THEN
    v_dedupe := 'chat_unread:' || v_contact.id::text;
    INSERT INTO public.admin_notifications (
      kind, title, body, contact_id, dedupe_key, event_count, is_read
    ) VALUES (
      'customer_message',
      'Mensaje de ' || v_contact.full_name,
      left(v_clean, 140),
      v_contact.id,
      v_dedupe,
      1,
      false
    )
    ON CONFLICT (dedupe_key) DO UPDATE
    SET title = 'Nuevos mensajes de ' || v_contact.full_name,
        body = left(v_clean, 140),
        event_count = CASE
          WHEN public.admin_notifications.is_read THEN 1
          ELSE public.admin_notifications.event_count + 1
        END,
        is_read = false,
        updated_at = timezone('utc', now());
  END IF;

  -- Respuesta automática inteligente sin spam si el bot está activo
  IF v_bot.is_enabled AND NOT v_contact.bot_paused THEN
    v_lower := lower(v_clean);
    FOR v_rule IN SELECT * FROM jsonb_array_elements(v_bot.keyword_rules)
    LOOP
      IF COALESCE((v_rule->>'active')::boolean, true) THEN
        FOR v_kw IN SELECT jsonb_array_elements_text(COALESCE(v_rule->'keywords', '[]'::jsonb))
        LOOP
          IF position(lower(v_kw) IN v_lower) > 0 THEN
            v_bot_reply := v_rule->>'reply';
            EXIT;
          END IF;
        END LOOP;
      END IF;
      EXIT WHEN v_bot_reply IS NOT NULL;
    END LOOP;

    IF v_bot_reply IS NULL THEN
      SELECT count(*) INTO v_recent_bot_count
      FROM public.chat_messages
      WHERE contact_id = v_contact.id
        AND sender_role IN ('bot', 'admin')
        AND created_at > timezone('utc', now()) - interval '20 minutes';

      IF v_recent_bot_count = 0 THEN
        v_bot_reply := v_bot.offline_or_wait_message;
      END IF;
    END IF;

    IF v_bot_reply IS NOT NULL THEN
      INSERT INTO public.chat_messages (
        contact_id, sender_role, sender_name, body
      ) VALUES (
        v_contact.id, 'bot', v_bot.bot_name, v_bot_reply
      );
    END IF;
  END IF;

  RETURN public.fetch_customer_thread(p_customer_token);
END;
$$;
