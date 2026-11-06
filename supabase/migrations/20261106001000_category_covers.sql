-- =============================================================================
-- Migración 0010: Portadas de referencia para Categorías y Subcategorías
-- Proyecto: PequeModas-Juguetería (StudioLexair)
-- =============================================================================

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS image_storage_path text;
