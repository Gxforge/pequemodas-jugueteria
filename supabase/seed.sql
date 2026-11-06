-- =============================================================================
-- Seed Inicial: Registro de la tienda SIN productos ni datos comerciales ficticios
-- Regla estricta: El catálogo inicial debe estar completamente vacío.
-- =============================================================================

WITH upserted_store AS (
  INSERT INTO public.stores (slug, name, owner_name, is_active)
  VALUES ('pequemodas-jugueteria', 'PequeModas-Juguetería', 'Katia', true)
  ON CONFLICT (slug) DO UPDATE
    SET name = EXCLUDED.name,
        owner_name = EXCLUDED.owner_name
  RETURNING id
)
INSERT INTO public.store_settings (
  store_id,
  commercial_name,
  description,
  phone,
  whatsapp_phone,
  address,
  business_hours,
  delivery_enabled,
  pickup_enabled,
  delivery_info,
  pickup_info,
  record_whatsapp_requests,
  social_links
)
SELECT
  id,
  'PequeModas-Juguetería',
  NULL,
  NULL,
  NULL,
  NULL,
  NULL,
  true,
  true,
  NULL,
  NULL,
  true,
  '{}'::jsonb
FROM upserted_store
ON CONFLICT (store_id) DO NOTHING;
