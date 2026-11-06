-- =============================================================================
-- Migración CRM 0004 (Aplicada en AMBOS Proyectos Supabase para Round-Robin):
-- Confirmación de Lectura estilo WhatsApp (read_at) + Bucket de Fotos 1GB Extra
-- + Métricas Unificadas de Base de Datos (500 MB) y Storage (1024 MB)
-- =============================================================================

ALTER TABLE public.chat_messages
  ADD COLUMN IF NOT EXISTS read_at timestamptz;

-- Asegura que el bucket público product-images exista en ambos proyectos (1 GB + 1 GB = 2 GB)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

DROP POLICY IF EXISTS "public_read_product_images_rr" ON storage.objects;
CREATE POLICY "public_read_product_images_rr" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'product-images');

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

  -- Marca como revisados (doble palomita azul para la tienda) los mensajes de admin/bot
  UPDATE public.chat_messages
  SET read_at = timezone('utc', now())
  WHERE contact_id = v_contact.id
    AND sender_role IN ('admin', 'bot')
    AND read_at IS NULL;

  SELECT COALESCE(jsonb_agg(row_to_json(m) ORDER BY m.created_at ASC), '[]'::jsonb)
  INTO v_messages
  FROM (
    SELECT id, sender_role, sender_name, body, order_id, read_at, created_at
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

CREATE OR REPLACE FUNCTION public.get_crm_storage_overview()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_db_bytes bigint := 0;
  v_storage_bytes bigint := 0;
  v_contacts bigint := 0;
  v_orders bigint := 0;
  v_pending_orders bigint := 0;
  v_unread_chats bigint := 0;
  v_unread_notifs bigint := 0;
  v_messages bigint := 0;
BEGIN
  SELECT pg_database_size(current_database()) INTO v_db_bytes;
  SELECT COALESCE(sum(COALESCE((metadata->>'size')::bigint, 0)), 0)
    INTO v_storage_bytes
    FROM storage.objects;

  SELECT count(*) INTO v_contacts FROM public.customer_contacts;
  SELECT count(*) INTO v_orders FROM public.direct_orders;
  SELECT count(*) INTO v_pending_orders FROM public.direct_orders WHERE status = 'pending';
  SELECT count(*) INTO v_unread_chats FROM public.customer_contacts WHERE unread_for_admin > 0;
  SELECT count(*) INTO v_unread_notifs FROM public.admin_notifications WHERE is_read = false;
  SELECT count(*) INTO v_messages FROM public.chat_messages;

  RETURN jsonb_build_object(
    'dbBytesUsed', v_db_bytes,
    'dbQuotaBytes', 524288000,
    'storageBytesUsed', v_storage_bytes,
    'storageQuotaBytes', 1073741824,
    'contactsCount', v_contacts,
    'directOrdersCount', v_orders,
    'pendingOrdersCount', v_pending_orders,
    'unreadChatsCount', v_unread_chats,
    'unreadNotificationsCount', v_unread_notifs,
    'messagesCount', v_messages
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.fetch_customer_thread(uuid) TO anon, authenticated;
