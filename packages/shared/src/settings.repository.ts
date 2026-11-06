import { STORAGE_LIMITS } from '@pequemodas/config';
import type { StoreSettingsFormInput } from '@pequemodas/schemas';
import { buildUniqueStoragePath, validateImageFile } from '@pequemodas/utils';
import { getSupabaseClient } from './supabase-client';
import type { StoreRow, StoreSettingsRow } from './types';

export async function fetchActiveStoreAndSettings(): Promise<{
  store: StoreRow;
  settings: StoreSettingsRow;
}> {
  const supabase = getSupabaseClient();
  const { data: store, error: storeErr } = await supabase
    .from('stores')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  if (storeErr || !store) {
    throw new Error(storeErr?.message ?? 'No se encontró la configuración base de la tienda.');
  }

  const { data: settings, error: settingsErr } = await supabase
    .from('store_settings')
    .select('*')
    .eq('store_id', store.id)
    .single();

  if (settingsErr || !settings) {
    throw new Error(settingsErr?.message ?? 'No se encontraron los ajustes de la tienda.');
  }

  return {
    store: store as StoreRow,
    settings: settings as StoreSettingsRow
  };
}

export async function updateStoreSettings(
  storeId: string,
  input: StoreSettingsFormInput
): Promise<StoreSettingsRow> {
  const supabase = getSupabaseClient();

  await supabase
    .from('stores')
    .update({ name: input.commercialName.trim() })
    .eq('id', storeId);

  const payload = {
    commercial_name: input.commercialName.trim(),
    description: input.description?.trim() || null,
    logo_url: input.logoUrl?.trim() || null,
    phone: input.phone?.trim() || null,
    whatsapp_phone: input.whatsappPhone?.trim() || null,
    address: input.address?.trim() || null,
    business_hours: input.businessHours?.trim() || null,
    delivery_enabled: input.deliveryEnabled,
    pickup_enabled: input.pickupEnabled,
    delivery_info: input.deliveryInfo?.trim() || null,
    pickup_info: input.pickupInfo?.trim() || null,
    record_whatsapp_requests: input.recordWhatsappRequests,
    social_links: input.socialLinks ?? {}
  };

  const { data, error } = await supabase
    .from('store_settings')
    .update(payload)
    .eq('store_id', storeId)
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'Error al guardar la configuración.');
  }

  await supabase.from('audit_logs').insert({
    store_id: storeId,
    action: 'settings.update',
    entity_type: 'store_settings',
    entity_id: data.id,
    metadata: { commercial_name: payload.commercial_name }
  });

  return data as StoreSettingsRow;
}

export async function uploadStoreLogo(
  storeId: string,
  file: File
): Promise<{ publicUrl: string; storagePath: string }> {
  const check = validateImageFile(file, 3 * 1024 * 1024);
  if (!check.valid) {
    throw new Error(check.error);
  }
  const supabase = getSupabaseClient();
  const ext = file.type === 'image/png' ? 'png' : file.type === 'image/webp' ? 'webp' : 'jpg';
  const storagePath = buildUniqueStoragePath(`logos/${storeId}`, ext);

  const { error: upErr } = await supabase.storage
    .from(STORAGE_LIMITS.brandBucket)
    .upload(storagePath, file, { contentType: file.type, upsert: false });

  if (upErr) {
    throw new Error(`No se pudo subir el logotipo: ${upErr.message}`);
  }

  const { data: urlData } = supabase.storage
    .from(STORAGE_LIMITS.brandBucket)
    .getPublicUrl(storagePath);

  await supabase
    .from('store_settings')
    .update({ logo_url: urlData.publicUrl, logo_storage_path: storagePath })
    .eq('store_id', storeId);

  return { publicUrl: urlData.publicUrl, storagePath };
}
