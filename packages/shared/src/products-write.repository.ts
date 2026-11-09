import type {
  ProductFormInput,
  ProductVariantInput,
  PublicationStatus
} from '@pequemodas/schemas';
import { slugify } from '@pequemodas/utils';
import { getSupabaseClient } from './supabase-client';
import { fetchProductById } from './products-read.repository';
import { syncProductVariants } from './products-variants.repository';
import type { ProductDetailDto } from './types';

export { syncProductVariants };

export async function createProductWithVariants(
  storeId: string,
  input: ProductFormInput,
  variants: ProductVariantInput[]
): Promise<ProductDetailDto> {
  const supabase = getSupabaseClient();
  const hasVariants = variants.length > 0;

  const { data: product, error } = await supabase
    .from('products')
    .insert({
      store_id: storeId,
      name: input.name.trim(),
      slug: input.slug.trim(),
      description: input.description?.trim() || null,
      base_price_cup: input.basePriceCup,
      currency_code: input.currencyCode,
      category_id: input.categoryId || null,
      subcategory_id: input.subcategoryId || null,
      inventory_mode: input.inventoryMode,
      manual_availability: input.manualAvailability,
      publication_status: input.publicationStatus,
      is_featured: input.isFeatured,
      has_variants: hasVariants
    })
    .select('*')
    .single();

  if (error || !product) {
    throw new Error(error?.message ?? 'No se pudo crear el producto.');
  }

  await supabase.from('inventory').insert({
    product_id: product.id,
    variant_id: null,
    quantity: hasVariants ? 0 : Math.max(0, input.stockQuantity)
  });

  if (hasVariants) {
    await syncProductVariants(product.id, variants);
  }

  await supabase.from('audit_logs').insert({
    store_id: storeId,
    action: 'product.create',
    entity_type: 'product',
    entity_id: product.id,
    metadata: { name: product.name, variants_count: variants.length }
  });

  const full = await fetchProductById(product.id);
  if (!full) throw new Error('Error al recuperar el producto recién creado.');
  return full;
}

export async function updateProductWithVariants(
  productId: string,
  storeId: string,
  input: ProductFormInput,
  variants: ProductVariantInput[]
): Promise<ProductDetailDto> {
  const supabase = getSupabaseClient();
  const hasVariants = variants.length > 0;

  const { error } = await supabase
    .from('products')
    .update({
      name: input.name.trim(),
      slug: input.slug.trim(),
      description: input.description?.trim() || null,
      base_price_cup: input.basePriceCup,
      currency_code: input.currencyCode,
      category_id: input.categoryId || null,
      subcategory_id: input.subcategoryId || null,
      inventory_mode: input.inventoryMode,
      manual_availability: input.manualAvailability,
      publication_status: input.publicationStatus,
      is_featured: input.isFeatured,
      has_variants: hasVariants
    })
    .eq('id', productId);

  if (error) {
    throw new Error(`No se pudo actualizar el producto: ${error.message}`);
  }

  if (!hasVariants) {
    const { data: rootInv } = await supabase
      .from('inventory')
      .select('id')
      .eq('product_id', productId)
      .is('variant_id', null)
      .maybeSingle();

    if (rootInv) {
      await supabase
        .from('inventory')
        .update({ quantity: Math.max(0, input.stockQuantity) })
        .eq('id', rootInv.id);
    } else {
      await supabase.from('inventory').insert({
        product_id: productId,
        variant_id: null,
        quantity: Math.max(0, input.stockQuantity)
      });
    }
  }

  await syncProductVariants(productId, variants);

  await supabase.from('audit_logs').insert({
    store_id: storeId,
    action: 'product.update',
    entity_type: 'product',
    entity_id: productId,
    metadata: { name: input.name, publication_status: input.publicationStatus }
  });

  const full = await fetchProductById(productId);
  if (!full) throw new Error('No se encontró el producto actualizado.');
  return full;
}

export async function setProductPublicationStatus(
  productId: string,
  storeId: string,
  status: PublicationStatus
): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('products')
    .update({ publication_status: status })
    .eq('id', productId);
  if (error) throw new Error(error.message);

  await supabase.from('audit_logs').insert({
    store_id: storeId,
    action: `product.status.${status}`,
    entity_type: 'product',
    entity_id: productId,
    metadata: { status }
  });
}

export async function duplicateProduct(
  productId: string,
  storeId: string
): Promise<ProductDetailDto> {
  const source = await fetchProductById(productId);
  if (!source) throw new Error('Producto origen no encontrado.');

  const copySlug = `${slugify(source.name)}-copia-${Date.now().toString(36).slice(-4)}`;
  const variantInputs: ProductVariantInput[] = source.variants.map((v, idx) => {
    const inv = source.inventory.find((i) => i.variant_id === v.id);
    return {
      name: v.name,
      sku: v.sku ?? '',
      attributes: v.attributes,
      priceOverrideCup: v.price_override_cup,
      stockQuantity: inv?.quantity ?? 0,
      manualAvailability: v.manual_availability,
      isActive: v.is_active,
      sortOrder: idx
    };
  });

  const rootInv = source.inventory.find((i) => i.variant_id === null);
  return createProductWithVariants(
    storeId,
    {
      name: `${source.name} (Copia)`,
      slug: copySlug,
      description: source.description ?? '',
      basePriceCup: source.base_price_cup,
      currencyCode: source.currency_code ?? 'CUP',
      categoryId: source.category_id,
      subcategoryId: source.subcategory_id,
      inventoryMode: source.inventory_mode,
      manualAvailability: source.manual_availability,
      stockQuantity: rootInv?.quantity ?? 0,
      publicationStatus: 'draft',
      isFeatured: false
    },
    variantInputs
  );
}

export async function deleteProductPermanently(
  productId: string,
  storeId: string
): Promise<void> {
  const supabase = getSupabaseClient();
  const existing = await fetchProductById(productId);
  if (existing && existing.images.length > 0) {
    const paths = existing.images.flatMap((img) =>
      img.thumbnail_path ? [img.storage_path, img.thumbnail_path] : [img.storage_path]
    );
    await supabase.storage.from('product-images').remove(paths);
  }
  const { error } = await supabase.from('products').delete().eq('id', productId);
  if (error) throw new Error(`Error al eliminar producto: ${error.message}`);

  await supabase.from('audit_logs').insert({
    store_id: storeId,
    action: 'product.delete',
    entity_type: 'product',
    entity_id: productId,
    metadata: { name: existing?.name }
  });
}
