import { PAGINATION_DEFAULTS } from '@pequemodas/config';
import type { PublicationStatus } from '@pequemodas/schemas';
import { getSupabaseClient } from './supabase-client';
import type { ProductDetailDto } from './types';

export type ProductSortOption = 'newest' | 'price_asc' | 'price_desc' | 'name_asc';

export interface ProductQueryFilters {
  search?: string;
  categoryId?: string;
  subcategoryId?: string;
  publicationStatus?: PublicationStatus | 'all';
  onlyFeatured?: boolean;
  sort?: ProductSortOption;
  page?: number;
  pageSize?: number;
}

export interface PaginatedProductsResult {
  items: ProductDetailDto[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const PRODUCT_SELECT_RELATIONS = `
  *,
  category:categories!products_category_id_fkey(id, name, slug),
  subcategory:categories!products_subcategory_id_fkey(id, name, slug),
  images:product_images(*),
  variants:product_variants(*),
  inventory:inventory(*)
`;

function normalizeProductDto(raw: Record<string, unknown>): ProductDetailDto {
  const dto = raw as unknown as ProductDetailDto;
  return {
    ...dto,
    base_price_cup: Number(dto.base_price_cup),
    images: (dto.images ?? []).sort((a, b) => a.sort_order - b.sort_order),
    variants: (dto.variants ?? [])
      .map((v) => ({
        ...v,
        price_override_cup:
          v.price_override_cup !== null && v.price_override_cup !== undefined
            ? Number(v.price_override_cup)
            : null
      }))
      .sort((a, b) => a.sort_order - b.sort_order),
    inventory: dto.inventory ?? []
  };
}

export async function fetchProductsPaginated(
  filters: ProductQueryFilters = {}
): Promise<PaginatedProductsResult> {
  const supabase = getSupabaseClient();
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = filters.pageSize ?? PAGINATION_DEFAULTS.storefrontPageSize;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('products')
    .select(PRODUCT_SELECT_RELATIONS, { count: 'exact' });

  if (filters.publicationStatus && filters.publicationStatus !== 'all') {
    query = query.eq('publication_status', filters.publicationStatus);
  }
  if (filters.categoryId) {
    query = query.eq('category_id', filters.categoryId);
  }
  if (filters.subcategoryId) {
    query = query.eq('subcategory_id', filters.subcategoryId);
  }
  if (filters.onlyFeatured) {
    query = query.eq('is_featured', true);
  }
  if (filters.search?.trim()) {
    const term = filters.search.trim().replace(/[%_]/g, '');
    query = query.or(`name.ilike.%${term}%,description.ilike.%${term}%`);
  }

  switch (filters.sort) {
    case 'price_asc':
      query = query.order('base_price_cup', { ascending: true });
      break;
    case 'price_desc':
      query = query.order('base_price_cup', { ascending: false });
      break;
    case 'name_asc':
      query = query.order('name', { ascending: true });
      break;
    default:
      query = query.order('created_at', { ascending: false });
      break;
  }

  const { data, count, error } = await query.range(from, to);
  if (error) {
    throw new Error(`Error al consultar el catálogo: ${error.message}`);
  }

  const total = count ?? 0;
  return {
    items: (data ?? []).map((row) => normalizeProductDto(row as Record<string, unknown>)),
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize))
  };
}

export async function fetchProductBySlug(slug: string): Promise<ProductDetailDto | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT_RELATIONS)
    .eq('slug', slug)
    .maybeSingle();

  if (error) {
    throw new Error(`Error al cargar el producto: ${error.message}`);
  }
  return data ? normalizeProductDto(data as Record<string, unknown>) : null;
}

export async function fetchProductById(productId: string): Promise<ProductDetailDto | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT_RELATIONS)
    .eq('id', productId)
    .maybeSingle();

  if (error) {
    throw new Error(`Error al cargar el producto: ${error.message}`);
  }
  return data ? normalizeProductDto(data as Record<string, unknown>) : null;
}

export async function fetchRelatedProducts(
  productId: string,
  categoryId: string | null
): Promise<ProductDetailDto[]> {
  const supabase = getSupabaseClient();
  let query = supabase
    .from('products')
    .select(PRODUCT_SELECT_RELATIONS)
    .eq('publication_status', 'published')
    .neq('id', productId)
    .limit(PAGINATION_DEFAULTS.relatedProductsLimit);

  if (categoryId) {
    query = query.eq('category_id', categoryId);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) return [];
  return (data ?? []).map((row) => normalizeProductDto(row as Record<string, unknown>));
}
