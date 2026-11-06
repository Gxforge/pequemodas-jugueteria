-- =============================================================================
-- Migración 0007: Buckets de Supabase Storage y Políticas de Seguridad
-- Proyecto: PequeModas-Juguetería (StudioLexair)
-- =============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  (
    'product-images',
    'product-images',
    true,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp']
  ),
  (
    'brand-assets',
    'brand-assets',
    true,
    3145728,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
  )
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Lectura pública de objetos en buckets públicos de catálogo y marca
DROP POLICY IF EXISTS "pequemodas_storage_public_read" ON storage.objects;
CREATE POLICY "pequemodas_storage_public_read" ON storage.objects
  FOR SELECT
  USING (bucket_id IN ('product-images', 'brand-assets'));

-- Subida exclusiva para administradora verificada
DROP POLICY IF EXISTS "pequemodas_storage_admin_insert" ON storage.objects;
CREATE POLICY "pequemodas_storage_admin_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id IN ('product-images', 'brand-assets')
    AND public.is_store_admin()
  );

-- Actualización exclusiva para administradora verificada
DROP POLICY IF EXISTS "pequemodas_storage_admin_update" ON storage.objects;
CREATE POLICY "pequemodas_storage_admin_update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id IN ('product-images', 'brand-assets')
    AND public.is_store_admin()
  )
  WITH CHECK (
    bucket_id IN ('product-images', 'brand-assets')
    AND public.is_store_admin()
  );

-- Eliminación exclusiva para administradora verificada
DROP POLICY IF EXISTS "pequemodas_storage_admin_delete" ON storage.objects;
CREATE POLICY "pequemodas_storage_admin_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id IN ('product-images', 'brand-assets')
    AND public.is_store_admin()
  );
