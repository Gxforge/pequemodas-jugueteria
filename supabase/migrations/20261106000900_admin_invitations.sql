-- =============================================================================
-- Migración 0009: Invitaciones Seguras de Un Solo Uso para Administradores
-- Proyecto: PequeModas-Juguetería (StudioLexair)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.admin_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  token_hash text NOT NULL UNIQUE,
  intended_name text NOT NULL DEFAULT 'Katia',
  role text NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'admin')),
  expires_at timestamptz NOT NULL DEFAULT (timezone('utc', now()) + interval '14 days'),
  used_at timestamptz,
  used_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_admin_invitations_store_created
  ON public.admin_invitations (store_id, created_at DESC);

ALTER TABLE public.admin_invitations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_invitations_admin_all" ON public.admin_invitations;
CREATE POLICY "admin_invitations_admin_all" ON public.admin_invitations
  FOR ALL TO authenticated
  USING (public.is_store_admin())
  WITH CHECK (public.is_store_admin());

CREATE OR REPLACE FUNCTION public.preview_admin_invitation(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_hash text;
  v_inv public.admin_invitations;
BEGIN
  IF p_token IS NULL OR length(trim(p_token)) < 16 THEN
    RETURN jsonb_build_object('valid', false);
  END IF;

  v_hash := encode(extensions.digest(trim(p_token), 'sha256'), 'hex');

  SELECT * INTO v_inv
  FROM public.admin_invitations
  WHERE token_hash = v_hash
    AND used_at IS NULL
    AND expires_at > timezone('utc', now())
  LIMIT 1;

  IF v_inv.id IS NULL THEN
    RETURN jsonb_build_object('valid', false);
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'intended_name', v_inv.intended_name,
    'role', v_inv.role,
    'expires_at', v_inv.expires_at
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.preview_admin_invitation(text) TO anon, authenticated;
