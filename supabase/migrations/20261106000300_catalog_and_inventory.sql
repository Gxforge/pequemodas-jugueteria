-- =============================================================================
-- Migración 0003: Categorías, Productos, Fotografías, Variantes e Inventario
-- Proyecto: PequeModas-Juguetería (StudioLexair)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  sort_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  is_archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT uq_categories_store_slug UNIQUE (store_id, slug),
  CONSTRAINT chk_categories_no_self_parent CHECK (parent_id IS NULL OR parent_id <> id)
);

CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  subcategory_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  name text NOT NULL,
  slug text NOT NULL,
  description text,
  base_price_cup numeric(12, 2) NOT NULL DEFAULT 0 CHECK (base_price_cup >= 0),
  inventory_mode text NOT NULL DEFAULT 'quantity' CHECK (inventory_mode IN ('quantity', 'manual')),
  manual_availability text NOT NULL DEFAULT 'available' CHECK (
    manual_availability IN ('available', 'out_of_stock', 'inquire')
  ),
  publication_status text NOT NULL DEFAULT 'draft' CHECK (
    publication_status IN ('draft', 'published', 'hidden', 'archived')
  ),
  is_featured boolean NOT NULL DEFAULT false,
  has_variants boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT uq_products_store_slug UNIQUE (store_id, slug)
);

CREATE TABLE IF NOT EXISTS public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  storage_bucket text NOT NULL DEFAULT 'product-images',
  storage_path text NOT NULL,
  thumbnail_path text,
  public_url text NOT NULL,
  thumbnail_url text,
  alt_text text,
  mime_type text NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp')),
  size_bytes integer NOT NULL CHECK (size_bytes > 0),
  width integer,
  height integer,
  is_primary boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  name text NOT NULL,
  sku text,
  attributes jsonb NOT NULL DEFAULT '{}'::jsonb,
  price_override_cup numeric(12, 2) CHECK (price_override_cup IS NULL OR price_override_cup >= 0),
  manual_availability text NOT NULL DEFAULT 'available' CHECK (
    manual_availability IN ('available', 'out_of_stock', 'inquire')
  ),
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE TABLE IF NOT EXISTS public.inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  variant_id uuid REFERENCES public.product_variants(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  low_stock_threshold integer NOT NULL DEFAULT 2 CHECK (low_stock_threshold >= 0),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_inventory_product_root
  ON public.inventory (product_id)
  WHERE variant_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_inventory_product_variant
  ON public.inventory (product_id, variant_id)
  WHERE variant_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_categories_parent_sort
  ON public.categories (store_id, parent_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_products_store_status_created
  ON public.products (store_id, publication_status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_products_category
  ON public.products (category_id, subcategory_id);

CREATE INDEX IF NOT EXISTS idx_product_images_product_sort
  ON public.product_images (product_id, is_primary DESC, sort_order ASC);

CREATE INDEX IF NOT EXISTS idx_product_variants_product_sort
  ON public.product_variants (product_id, sort_order ASC);

DROP TRIGGER IF EXISTS trg_categories_updated_at ON public.categories;
CREATE TRIGGER trg_categories_updated_at
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_products_updated_at ON public.products;
CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_product_variants_updated_at ON public.product_variants;
CREATE TRIGGER trg_product_variants_updated_at
  BEFORE UPDATE ON public.product_variants
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_inventory_updated_at ON public.inventory;
CREATE TRIGGER trg_inventory_updated_at
  BEFORE UPDATE ON public.inventory
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
