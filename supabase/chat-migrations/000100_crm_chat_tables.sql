-- =============================================================================
-- Proyecto 2 (pequemodas-jugueteria-chat): CRM, Pedidos en App, Chat y Bot
-- Migración 0001: Tablas principales y Row Level Security estricto
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.customer_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  phone text NOT NULL,
  municipality_or_address text,
  notes text,
  bot_paused boolean NOT NULL DEFAULT false,
  unread_for_admin integer NOT NULL DEFAULT 0,
  unread_for_customer integer NOT NULL DEFAULT 0,
  last_message_preview text,
  last_message_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_customer_contacts_last_msg
  ON public.customer_contacts (last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_customer_contacts_phone
  ON public.customer_contacts (phone);

CREATE TABLE IF NOT EXISTS public.direct_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_code text NOT NULL UNIQUE,
  contact_id uuid NOT NULL REFERENCES public.customer_contacts(id) ON DELETE CASCADE,
  delivery_mode text NOT NULL DEFAULT 'delivery' CHECK (
    delivery_mode IN ('delivery', 'pickup')
  ),
  delivery_address text,
  delivery_notes text,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  estimated_total_cup numeric(12, 2) NOT NULL DEFAULT 0 CHECK (estimated_total_cup >= 0),
  status text NOT NULL DEFAULT 'pending' CHECK (
    status IN ('pending', 'confirmed', 'preparing', 'completed', 'cancelled')
  ),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_direct_orders_contact
  ON public.direct_orders (contact_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES public.customer_contacts(id) ON DELETE CASCADE,
  sender_role text NOT NULL CHECK (sender_role IN ('customer', 'admin', 'bot')),
  sender_name text,
  body text NOT NULL,
  order_id uuid REFERENCES public.direct_orders(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_contact_time
  ON public.chat_messages (contact_id, created_at ASC);

CREATE TABLE IF NOT EXISTS public.admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (
    kind IN ('direct_order', 'customer_message', 'cart_activity')
  ),
  title text NOT NULL,
  body text NOT NULL,
  contact_id uuid REFERENCES public.customer_contacts(id) ON DELETE CASCADE,
  order_id uuid REFERENCES public.direct_orders(id) ON DELETE SET NULL,
  dedupe_key text UNIQUE,
  event_count integer NOT NULL DEFAULT 1,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_unread
  ON public.admin_notifications (is_read, updated_at DESC);

CREATE TABLE IF NOT EXISTS public.bot_config (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  is_enabled boolean NOT NULL DEFAULT true,
  bot_name text NOT NULL DEFAULT 'Asistente PequeModas',
  welcome_message text NOT NULL DEFAULT '¡Hola! Soy el asistente de PequeModas-Juguetería. Escríbenos tu consulta o pedido y Katia te atenderá enseguida por aquí.',
  order_received_message text NOT NULL DEFAULT '¡Recibimos tu solicitud de compra! Katia revisará disponibilidad real y te confirmará por este chat o a tu teléfono antes de apartar el inventario.',
  offline_or_wait_message text NOT NULL DEFAULT 'Gracias por escribirnos. Ya avisamos a Katia de tu mensaje para que te responda lo antes posible.',
  keyword_rules jsonb NOT NULL DEFAULT '[
    {"id":"envio","keywords":["envio","domicilio","entrega","mensajeria"],"reply":"Realizamos coordinación de entrega o recogida directamente contigo al confirmar disponibilidad. Cuéntanos tu municipio o zona.","active":true},
    {"id":"precio","keywords":["precio","cup","moneda","pago"],"reply":"Todos los precios del catálogo están expresados en CUP. El pago y la entrega se coordinan personalmente al confirmar tu pedido.","active":true}
  ]'::jsonb,
  notify_on_cart_add boolean NOT NULL DEFAULT true,
  notify_on_chat boolean NOT NULL DEFAULT true,
  cart_cooldown_minutes integer NOT NULL DEFAULT 30 CHECK (
    cart_cooldown_minutes BETWEEN 5 AND 240
  ),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

INSERT INTO public.bot_config (id)
VALUES (1)
ON CONFLICT (id) DO NOTHING;

-- Seguridad: RLS activado en todas las tablas (sin lectura pública directa)
ALTER TABLE public.customer_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.direct_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_config ENABLE ROW LEVEL SECURITY;
