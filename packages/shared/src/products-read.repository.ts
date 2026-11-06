import { PAGINATION_DEFAULTS } from '@pequemodas/config';
import type { PublicationStatus } from '@pequemodas/schemas';
import { scoreSmartTextMatch, suggestDidYouMean } from '@pequemodas/utils';
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
  didYouMean?: string | null;
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

function sortProductsInMemory(
  list: ProductDetailDto[],
  sort?: ProductSortOption
): ProductDetailDto[] {
  const copy = [...list];
  switch (sort) {
    case 'price_asc':
      return copy.sort((a, b) => a.base_price_cup - b.base_price_cup);
    case 'price_desc':
      return copy.sort((a, b) => b.base_price_cup - a.base_price_cup);
    case 'name_asc':
      return copy.sort((a, b) => a.name.localeCompare(b.name));
    default:
      return copy.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
}

export async function fetchProductsPaginated(
  filters: ProductQueryFilters = {}
): Promise<PaginatedProductsResult> {
  const supabase = getSupabaseClient();
  const page = Math.max(1, filters.page ?? 1);
  const pageSize = filters.pageSize ?? PAGINATION_DEFAULTS.storefrontPageSize;
  const searchRaw = filters.search?.trim() ?? '';

  // Cuando el usuario escribe en el buscador, usamos búsqueda inteligente tolerante a errores ortográficos
  if (searchRaw) {
    let baseQuery = supabase.from('products').select(PRODUCT_SELECT_RELATIONS);
    if (filters.publicationStatus && filters.publicationStatus !== 'all') {
      baseQuery = baseQuery.eq('publication_status', filters.publicationStatus);
    }
    if (filters.categoryId) baseQuery = baseQuery.eq('category_id', filters.categoryId);
    if (filters.subcategoryId) {
      baseQuery = baseQuery.eq('subcategory_id', filters.subcategoryId);
    }
    if (filters.onlyFeatured) baseQuery = baseQuery.eq('is_featured', true);

    const { data: allRows, error: allErr } = await baseQuery.limit(300);
    if (allErr) {
      throw new Error(`Error al consultar el catálogo: ${allErr.message}`);
    }

    const allDtos = (allRows ?? []).map((r) =>
      normalizeProductDto(r as Record<string, unknown>)
    );

    const vocab = allDtos.flatMap((p) => [
      p.name,
      p.category?.name ?? '',
      p.subcategory?.name ?? ''
    ]);
    const didYouMean = suggestDidYouMean(searchRaw, vocab);

    const scored = allDtos
      .map((p) => {
        const fields = [
          p.name,
          p.description ?? '',
          p.category?.name ?? '',
          p.subcategory?.name ?? '',
          ...p.variants.map((v) => v.name)
        ];
        const s1 = scoreSmartTextMatch(searchRaw, fields);
        const s2 = didYouMean ? scoreSmartTextMatch(didYouMean, fields) : 0;
        return { product: p, score: Math.max(s1, s2) };
      })
      .filter((entry) => entry.score > 0);

    const ordered = filters.sort
      ? sortProductsInMemory(
          scored.map((s) => s.product),
          filters.sort
        )
      : scored.sort((a, b) => b.score - a.score).map((s) => s.product);

    const total = ordered.length;
    const start = (page - 1) * pageSize;
    return {
      items: ordered.slice(start, start + pageSize),
      total,
      page,
      pageSize,
      totalPages: Math.max(1, Math.ceil(total / pageSize)),
      didYouMean
    };
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  let query = supabase
    .from('products')
    .select(PRODUCT_SELECT_RELATIONS, { count: 'exact' });

  if (filters.publicationStatus && filters.publicationStatus !== 'all') {
    query = query.eq('publication_status', filters.publicationStatus);
  }
  if (filters.categoryId) query = query.eq('category_id', filters.categoryId);
  if (filters.subcategoryId) query = query.eq('subcategory_id', filters.subcategoryId);
  if (filters.onlyFeatured) query = query.eq('is_featured', true);

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
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
    didYouMean: null
  };
}

export async function fetchProductBySlug(slug: string): Promise<ProductDetailDto | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT_RELATIONS)
    .eq('slug', slug)
    .maybeSingle();

  if (error) throw new Error(`Error al cargar el producto: ${error.message}`);
  return data ? normalizeProductDto(data as Record<string, unknown>) : null;
}

export async function fetchProductById(productId: string): Promise<ProductDetailDto | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_SELECT_RELATIONS)
    .eq('id', productId)
    .maybeSingle();

  if (error) throw new Error(`Error al cargar el producto: ${error.message}`);
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
    .limit(4);

  if (categoryId) query = query.eq('category_id', categoryId);
  const { data } = await query;
  return (data ?? []).map((row) => normalizeProductDto(row as Record<string, unknown>));
}
