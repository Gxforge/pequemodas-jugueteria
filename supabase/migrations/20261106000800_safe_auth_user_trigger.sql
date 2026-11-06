-- =============================================================================
-- Migración 0008: Compatibilidad segura de trigger en auth.users
-- Proyecto: PequeModas-Juguetería (StudioLexair)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF to_regclass('public.users') IS NOT NULL THEN
    INSERT INTO public.users (id, full_name, phone)
    VALUES (
      NEW.id,
      COALESCE(
        NULLIF(trim(NEW.raw_user_meta_data->>'full_name'), ''),
        split_part(COALESCE(NEW.email, 'admin'), '@', 1),
        'Administradora'
      ),
      NEW.raw_user_meta_data->>'phone'
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NEW;
END;
$$;
