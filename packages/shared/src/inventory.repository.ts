import type {
  InventoryMovementInput,
  SwitchInventoryModeInput
} from '@pequemodas/schemas';
import { getSupabaseClient } from './supabase-client';
import type { InventoryMovementRow } from './types';

export async function recordInventoryMovement(
  input: InventoryMovementInput
): Promise<InventoryMovementRow> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.rpc('record_inventory_movement', {
    p_product_id: input.productId,
    p_variant_id: input.variantId || null,
    p_movement_type: input.movementType,
    p_quantity: input.quantity,
    p_reason: input.reason.trim()
  });

  if (error || !data) {
    throw new Error(error?.message ?? 'Error al registrar movimiento de inventario.');
  }
  return data as InventoryMovementRow;
}

export async function switchProductInventoryMode(
  storeId: string,
  input: SwitchInventoryModeInput
): Promise<void> {
  if (!input.confirmed) {
    throw new Error('Debes confirmar el cambio de modalidad de inventario.');
  }
  const supabase = getSupabaseClient();

  const { error } = await supabase
    .from('products')
    .update({
      inventory_mode: input.targetMode,
      manual_availability: input.manualAvailability
    })
    .eq('id', input.productId);

  if (error) {
    throw new Error(`No se pudo cambiar la modalidad: ${error.message}`);
  }

  const { data: rootInv } = await supabase
    .from('inventory')
    .select('quantity')
    .eq('product_id', input.productId)
    .is('variant_id', null)
    .maybeSingle();

  const currentQty = rootInv?.quantity ?? 0;

  await supabase.from('inventory_movements').insert({
    product_id: input.productId,
    variant_id: null,
    movement_type: 'mode_switch',
    quantity_delta: 0,
    previous_quantity: currentQty,
    new_quantity: currentQty,
    reason:
      input.targetMode === 'manual'
        ? `Cambio a disponibilidad manual (${input.manualAvailability}). Las cantidades previas se conservan.`
        : 'Cambio a control estricto por cantidades.'
  });

  await supabase.from('audit_logs').insert({
    store_id: storeId,
    action: 'inventory.mode_switch',
    entity_type: 'product',
    entity_id: input.productId,
    metadata: {
      target_mode: input.targetMode,
      manual_availability: input.manualAvailability
    }
  });
}

export async function fetchInventoryMovements(
  productId?: string,
  limit: number = 40
): Promise<InventoryMovementRow[]> {
  const supabase = getSupabaseClient();
  let query = supabase
    .from('inventory_movements')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (productId) {
    query = query.eq('product_id', productId);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Error al consultar el historial de inventario: ${error.message}`);
  }
  return (data ?? []) as InventoryMovementRow[];
}
