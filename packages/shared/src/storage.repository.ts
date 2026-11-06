import { STORAGE_LIMITS } from '@pequemodas/config';
import { buildUniqueStoragePath, optimizeProductImage } from '@pequemodas/utils';
import { isChatSupabaseConfigured } from './chat-supabase-client';
import { invokeShardGateway } from './crm-admin.repository';
import type { CrmShardId } from './crm-types';
import { getSupabaseClient } from './supabase-client';
import type { ProductImageRow } from './types';

let storageRoundRobinToggle: CrmShardId = 'p1';

function pickNextStorageShard(): CrmShardId {
  if (!isChatSupabaseConfigured()) return 'p1';
  storageRoundRobinToggle = storageRoundRobinToggle === 'p1' ? 'p2' : 'p1';
  return storageRoundRobinToggle;
}

async function blobToBase64(blob: Blob): Promise<string> {
  const buf = await blob.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = '';
  const chunk = 8192;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function uploadToShard(
  shard: CrmShardId,
  bucket: string,
  path: string,
  blob: Blob,
  mimeType: string
): Promise<string> {
  if (shard === 'p1') {
    const supabase = getSupabaseClient();
    const { error } = await supabase.storage.from(bucket).upload(path, blob, {
      contentType: mimeType,
      upsert: false
    });
    if (error) throw new Error(error.message);
    return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  }

  const base64 = await blobToBase64(blob);
  const res = await invokeShardGateway<{ publicUrl: string }>(
    'p2',
    'upload_storage_object',
    { bucket, path, contentType: mimeType, base64 }
  );
  return res.publicUrl;
}

async function removeFromShard(
  shard: CrmShardId,
  bucket: string,
  paths: string[]
): Promise<void> {
  if (paths.length === 0) return;
  if (shard === 'p1') {
    await getSupabaseClient().storage.from(bucket).remove(paths);
    return;
  }
  await invokeShardGateway('p2', 'delete_storage_objects', { bucket, paths });
}

export async function uploadProductPhotograph(params: {
  productId: string;
  file: File;
  altText?: string;
  isPrimary?: boolean;
  sortOrder?: number;
}): Promise<ProductImageRow> {
  const supabase = getSupabaseClient();
  const optimized = await optimizeProductImage(params.file);
  const shard = pickNextStorageShard();

  const fullPath = buildUniqueStoragePath(
    `products/${params.productId}`,
    optimized.extension
  );
  const thumbPath = buildUniqueStoragePath(
    `products/${params.productId}/thumbs`,
    optimized.extension
  );

  let usedShard: CrmShardId = shard;
  let fullUrl = '';
  let thumbUrl = '';

  try {
    fullUrl = await uploadToShard(
      usedShard,
      STORAGE_LIMITS.productBucket,
      fullPath,
      optimized.fullBlob,
      optimized.mimeType
    );
    thumbUrl = await uploadToShard(
      usedShard,
      STORAGE_LIMITS.productBucket,
      thumbPath,
      optimized.thumbnailBlob,
      optimized.mimeType
    );
  } catch {
    usedShard = 'p1';
    fullUrl = await uploadToShard(
      'p1',
      STORAGE_LIMITS.productBucket,
      fullPath,
      optimized.fullBlob,
      optimized.mimeType
    );
    thumbUrl = await uploadToShard(
      'p1',
      STORAGE_LIMITS.productBucket,
      thumbPath,
      optimized.thumbnailBlob,
      optimized.mimeType
    );
  }

  if (params.isPrimary) {
    await supabase
      .from('product_images')
      .update({ is_primary: false })
      .eq('product_id', params.productId);
  }

  const { data, error: dbErr } = await supabase
    .from('product_images')
    .insert({
      product_id: params.productId,
      storage_bucket: STORAGE_LIMITS.productBucket,
      storage_path: fullPath,
      thumbnail_path: thumbPath,
      public_url: fullUrl,
      thumbnail_url: thumbUrl,
      alt_text: params.altText?.trim() || params.file.name,
      mime_type: optimized.mimeType,
      size_bytes: optimized.fullBlob.size + optimized.thumbnailBlob.size,
      width: optimized.width,
      height: optimized.height,
      is_primary: Boolean(params.isPrimary),
      sort_order: params.sortOrder ?? 0
    })
    .select('*')
    .single();

  if (dbErr || !data) {
    await removeFromShard(usedShard, STORAGE_LIMITS.productBucket, [fullPath, thumbPath]);
    throw new Error(dbErr?.message ?? 'Error al registrar la fotografía.');
  }

  return data as ProductImageRow;
}

export async function setPrimaryProductImage(
  productId: string,
  imageId: string
): Promise<void> {
  const supabase = getSupabaseClient();
  await supabase
    .from('product_images')
    .update({ is_primary: false })
    .eq('product_id', productId);

  const { error } = await supabase
    .from('product_images')
    .update({ is_primary: true })
    .eq('id', imageId);

  if (error) throw new Error(`No se pudo cambiar la imagen principal: ${error.message}`);
}

export async function reorderProductImages(orderedIds: string[]): Promise<void> {
  const supabase = getSupabaseClient();
  for (let i = 0; i < orderedIds.length; i += 1) {
    const id = orderedIds[i];
    if (!id) continue;
    await supabase.from('product_images').update({ sort_order: i }).eq('id', id);
  }
}

export async function deleteProductImage(image: ProductImageRow): Promise<void> {
  const supabase = getSupabaseClient();
  const paths = image.thumbnail_path
    ? [image.storage_path, image.thumbnail_path]
    : [image.storage_path];

  const isOnSecondStorage =
    isChatSupabaseConfigured() && !image.public_url.includes('vcohlillbvznsovswdng');
  await removeFromShard(isOnSecondStorage ? 'p2' : 'p1', image.storage_bucket, paths);

  const { error } = await supabase.from('product_images').delete().eq('id', image.id);
  if (error) throw new Error(`Error al eliminar la fotografía: ${error.message}`);
}
