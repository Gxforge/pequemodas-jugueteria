import { STORAGE_LIMITS } from '@pequemodas/config';
import { buildUniqueStoragePath, optimizeProductImage } from '@pequemodas/utils';
import { getSupabaseClient } from './supabase-client';
import type { ProductImageRow } from './types';

export async function uploadProductPhotograph(params: {
  productId: string;
  file: File;
  altText?: string;
  isPrimary?: boolean;
  sortOrder?: number;
}): Promise<ProductImageRow> {
  const supabase = getSupabaseClient();
  const optimized = await optimizeProductImage(params.file);

  const fullPath = buildUniqueStoragePath(
    `products/${params.productId}`,
    optimized.extension
  );
  const thumbPath = buildUniqueStoragePath(
    `products/${params.productId}/thumbs`,
    optimized.extension
  );

  const { error: fullErr } = await supabase.storage
    .from(STORAGE_LIMITS.productBucket)
    .upload(fullPath, optimized.fullBlob, {
      contentType: optimized.mimeType,
      upsert: false
    });

  if (fullErr) {
    throw new Error(`Error de almacenamiento al subir imagen: ${fullErr.message}`);
  }

  const { error: thumbErr } = await supabase.storage
    .from(STORAGE_LIMITS.productBucket)
    .upload(thumbPath, optimized.thumbnailBlob, {
      contentType: optimized.mimeType,
      upsert: false
    });

  if (thumbErr) {
    await supabase.storage.from(STORAGE_LIMITS.productBucket).remove([fullPath]);
    throw new Error(`Error al generar miniatura en Storage: ${thumbErr.message}`);
  }

  const fullUrl = supabase.storage
    .from(STORAGE_LIMITS.productBucket)
    .getPublicUrl(fullPath).data.publicUrl;
  const thumbUrl = supabase.storage
    .from(STORAGE_LIMITS.productBucket)
    .getPublicUrl(thumbPath).data.publicUrl;

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
    await supabase.storage.from(STORAGE_LIMITS.productBucket).remove([fullPath, thumbPath]);
    throw new Error(dbErr?.message ?? 'Error al registrar metadatos de la fotografía.');
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

export async function reorderProductImages(
  orderedIds: string[]
): Promise<void> {
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

  await supabase.storage.from(image.storage_bucket).remove(paths);
  const { error } = await supabase.from('product_images').delete().eq('id', image.id);
  if (error) throw new Error(`Error al eliminar la fotografía: ${error.message}`);
}
