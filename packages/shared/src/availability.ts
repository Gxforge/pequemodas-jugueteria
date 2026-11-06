import type { ManualAvailability } from '@pequemodas/schemas';
import type { InventoryRow, ProductDetailDto, ProductVariantRow } from './types';

export interface ResolvedAvailability {
  status: ManualAvailability;
  availableQuantity: number | null;
  canAddToCart: boolean;
  unitPriceCup: number;
}

export function getRootInventoryQuantity(inventory: InventoryRow[]): number {
  const root = inventory.find((row) => row.variant_id === null);
  return root ? root.quantity : 0;
}

export function getVariantInventoryQuantity(
  inventory: InventoryRow[],
  variantId: string
): number {
  const found = inventory.find((row) => row.variant_id === variantId);
  return found ? found.quantity : 0;
}

export function resolveVariantAvailability(
  product: Pick<ProductDetailDto, 'inventory_mode' | 'base_price_cup' | 'inventory'>,
  variant: ProductVariantRow
): ResolvedAvailability {
  const unitPriceCup =
    variant.price_override_cup !== null && variant.price_override_cup !== undefined
      ? Number(variant.price_override_cup)
      : Number(product.base_price_cup);

  if (!variant.is_active) {
    return {
      status: 'out_of_stock',
      availableQuantity: 0,
      canAddToCart: false,
      unitPriceCup
    };
  }

  if (product.inventory_mode === 'quantity') {
    const qty = getVariantInventoryQuantity(product.inventory, variant.id);
    return {
      status: qty > 0 ? 'available' : 'out_of_stock',
      availableQuantity: qty,
      canAddToCart: qty > 0,
      unitPriceCup
    };
  }

  return {
    status: variant.manual_availability,
    availableQuantity: null,
    canAddToCart: variant.manual_availability !== 'out_of_stock',
    unitPriceCup
  };
}

export function resolveProductAvailability(product: ProductDetailDto): ResolvedAvailability {
  const activeVariants = product.variants.filter((v) => v.is_active);

  if (activeVariants.length > 0) {
    const resolvedList = activeVariants.map((v) => resolveVariantAvailability(product, v));
    const minPrice = Math.min(...resolvedList.map((r) => r.unitPriceCup));

    if (product.inventory_mode === 'quantity') {
      const totalQty = resolvedList.reduce(
        (sum, r) => sum + (r.availableQuantity ?? 0),
        0
      );
      return {
        status: totalQty > 0 ? 'available' : 'out_of_stock',
        availableQuantity: totalQty,
        canAddToCart: totalQty > 0,
        unitPriceCup: minPrice
      };
    }

    const hasAvailable = resolvedList.some((r) => r.status === 'available');
    const hasInquire = resolvedList.some((r) => r.status === 'inquire');
    const status: ManualAvailability = hasAvailable
      ? 'available'
      : hasInquire
        ? 'inquire'
        : 'out_of_stock';

    return {
      status,
      availableQuantity: null,
      canAddToCart: status !== 'out_of_stock',
      unitPriceCup: minPrice
    };
  }

  const basePrice = Number(product.base_price_cup);
  if (product.inventory_mode === 'quantity') {
    const qty = getRootInventoryQuantity(product.inventory);
    return {
      status: qty > 0 ? 'available' : 'out_of_stock',
      availableQuantity: qty,
      canAddToCart: qty > 0,
      unitPriceCup: basePrice
    };
  }

  return {
    status: product.manual_availability,
    availableQuantity: null,
    canAddToCart: product.manual_availability !== 'out_of_stock',
    unitPriceCup: basePrice
  };
}

export function getPrimaryProductImage(product: Pick<ProductDetailDto, 'images'>): {
  fullUrl: string | null;
  thumbUrl: string | null;
} {
  if (!product.images || product.images.length === 0) {
    return { fullUrl: null, thumbUrl: null };
  }
  const sorted = [...product.images].sort((a, b) => {
    if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
    return a.sort_order - b.sort_order;
  });
  const first = sorted[0];
  if (!first) return { fullUrl: null, thumbUrl: null };
  return {
    fullUrl: first.public_url,
    thumbUrl: first.thumbnail_url ?? first.public_url
  };
}
