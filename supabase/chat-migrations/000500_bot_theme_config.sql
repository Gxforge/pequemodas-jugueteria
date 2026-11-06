-- =============================================================================
-- Migración Chat 000500: Personalización Completa de Colores y Cabecera del Chat/Bot
-- Proyecto: PequeModas-Juguetería (Aplicada en Proyecto 1 y Proyecto 2)
-- =============================================================================

ALTER TABLE public.bot_config
  ADD COLUMN IF NOT EXISTS header_title text NOT NULL DEFAULT 'Atención PequeModas',
  ADD COLUMN IF NOT EXISTS header_subtitle text NOT NULL DEFAULT 'Katia + Asistente en línea',
  ADD COLUMN IF NOT EXISTS theme_config jsonb NOT NULL DEFAULT '{
    "headerFrom": "#ec4899",
    "headerTo": "#0284c7",
    "botBubbleBg": "#e0f2fe",
    "botBubbleText": "#0f172a",
    "customerBubbleBg": "#dcf8c6",
    "customerBubbleText": "#0f172a",
    "adminBubbleBg": "#ffffff",
    "adminBubbleText": "#0f172a",
    "chatBg": "#f4efe6"
  }'::jsonb;

CREATE OR REPLACE FUNCTION public.get_public_bot_appearance()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'is_enabled', b.is_enabled,
    'bot_name', b.bot_name,
    'header_title', b.header_title,
    'header_subtitle', b.header_subtitle,
    'welcome_message', b.welcome_message,
    'theme_config', b.theme_config
  )
  FROM public.bot_config b
  WHERE b.id = 1
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_public_bot_appearance() TO anon, authenticated;
