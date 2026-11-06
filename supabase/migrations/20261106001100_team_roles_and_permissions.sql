-- =============================================================================
-- Migración 0011: Roles Amigables de Tienda y Permisos por Tarea en Equipo
-- Proyecto: PequeModas-Juguetería (StudioLexair)
-- =============================================================================

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS job_title text,
  ADD COLUMN IF NOT EXISTS permissions jsonb NOT NULL DEFAULT '{
    "chat": true,
    "products": true,
    "categories": true,
    "inventory": true,
    "settings": true,
    "team": true
  }'::jsonb;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('owner', 'admin', 'sales', 'catalog', 'moderator'));

ALTER TABLE public.admin_invitations
  DROP CONSTRAINT IF EXISTS admin_invitations_role_check;

ALTER TABLE public.admin_invitations
  ADD COLUMN IF NOT EXISTS job_title text,
  ADD COLUMN IF NOT EXISTS permissions jsonb NOT NULL DEFAULT '{
    "chat": true,
    "products": true,
    "categories": true,
    "inventory": true,
    "settings": false,
    "team": false
  }'::jsonb;

ALTER TABLE public.admin_invitations
  ADD CONSTRAINT admin_invitations_role_check
  CHECK (role IN ('owner', 'admin', 'sales', 'catalog', 'moderator'));

CREATE OR REPLACE FUNCTION public.is_store_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.is_active = true
      AND p.role IN ('owner', 'admin', 'sales', 'catalog', 'moderator')
  );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_team()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.is_active = true
      AND (
        p.role IN ('owner', 'admin')
        OR COALESCE((p.permissions->>'team')::boolean, false) = true
      )
  );
$$;

DROP POLICY IF EXISTS "profiles_team_manager_update" ON public.profiles;
CREATE POLICY "profiles_team_manager_update" ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.can_manage_team())
  WITH CHECK (public.can_manage_team());

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
    'job_title', v_inv.job_title,
    'permissions', v_inv.permissions,
    'expires_at', v_inv.expires_at
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.preview_admin_invitation(text) TO anon, authenticated;
