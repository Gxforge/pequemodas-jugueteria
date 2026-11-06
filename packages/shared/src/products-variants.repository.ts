import type { ProductVariantInput } from '@pequemodas/schemas';
import { getSupabaseClient } from './supabase-client';

export async function syncProductVariants(
  productId: string,
  variants: ProductVariantInput[]
): Promise<void> {
  const supabase = getSupabaseClient();
  const { data: existing } = await supabase
    .from('product_variants')
    .select('id')
    .eq('product_id', productId);

  const incomingIds = new Set(variants.map((v) => v.id).filter(Boolean));
  const toDeleteIds = (existing ?? [])
    .map((e: { id: string }) => e.id)
    .filter((id) => !incomingIds.has(id));

  if (toDeleteIds.length > 0) {
    await supabase.from('product_variants').delete().in('id', toDeleteIds);
  }

  for (let idx = 0; idx < variants.length; idx += 1) {
    const v = variants[idx];
    if (!v) continue;
    const payload = {
      product_id: productId,
      name: v.name.trim(),
      sku: v.sku?.trim() || null,
      attributes: v.attributes ?? {},
      price_override_cup:
        v.priceOverrideCup !== null && v.priceOverrideCup !== undefined
          ? v.priceOverrideCup
          : null,
      manual_availability: v.manualAvailability,
      is_active: v.isActive,
      sort_order: idx
    };

    let variantId = v.id;
    if (variantId && incomingIds.has(variantId)) {
      await supabase.from('product_variants').update(payload).eq('id', variantId);
    } else {
      const { data: created, error } = await supabase
        .from('product_variants')
        .insert(payload)
        .select('id')
        .single();
      if (error || !created) {
        throw new Error(error?.message ?? 'Error al guardar variante.');
      }
      variantId = created.id;
    }

    const { data: invRow } = await supabase
      .from('inventory')
      .select('id')
      .eq('product_id', productId)
      .eq('variant_id', variantId)
      .maybeSingle();

    if (invRow) {
      await supabase
        .from('inventory')
        .update({ quantity: Math.max(0, v.stockQuantity) })
        .eq('id', invRow.id);
    } else {
      await supabase.from('inventory').insert({
        product_id: productId,
        variant_id: variantId,
        quantity: Math.max(0, v.stockQuantity)
      });
    }
  }
}
