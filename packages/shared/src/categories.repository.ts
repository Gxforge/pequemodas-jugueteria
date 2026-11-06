import type { CategoryFormInput } from '@pequemodas/schemas';
import { getSupabaseClient } from './supabase-client';
import type { CategoryRow } from './types';

export interface CategoryTreeNode extends CategoryRow {
  subcategories: CategoryRow[];
}

export async function fetchCategories(options?: {
  includeArchived?: boolean;
  onlyActive?: boolean;
}): Promise<CategoryRow[]> {
  const supabase = getSupabaseClient();
  let query = supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });

  if (!options?.includeArchived) {
    query = query.eq('is_archived', false);
  }
  if (options?.onlyActive) {
    query = query.eq('is_active', true);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Error al cargar categorías: ${error.message}`);
  }
  return (data ?? []) as CategoryRow[];
}

export function buildCategoryTree(rows: CategoryRow[]): CategoryTreeNode[] {
  const roots = rows.filter((r) => r.parent_id === null);
  return roots.map((root) => ({
    ...root,
    subcategories: rows
      .filter((child) => child.parent_id === root.id)
      .sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name))
  }));
}

export async function createCategory(
  storeId: string,
  input: CategoryFormInput
): Promise<CategoryRow> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from('categories')
    .insert({
      store_id: storeId,
      name: input.name.trim(),
      slug: input.slug.trim(),
      description: input.description?.trim() || null,
      parent_id: input.parentId || null,
      sort_order: input.sortOrder,
      is_active: input.isActive,
      is_archived: input.isArchived
    })
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'No se pudo crear la categoría.');
  }

  await supabase.from('audit_logs').insert({
    store_id: storeId,
    action: 'category.create',
    entity_type: 'category',
    entity_id: data.id,
    metadata: { name: data.name, parent_id: data.parent_id }
  });

  return data as CategoryRow;
}

export async function updateCategory(
  categoryId: string,
  storeId: string,
  input: Partial<CategoryFormInput>
): Promise<CategoryRow> {
  const supabase = getSupabaseClient();
  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name.trim();
  if (input.slug !== undefined) patch.slug = input.slug.trim();
  if (input.description !== undefined) patch.description = input.description.trim() || null;
  if (input.parentId !== undefined) patch.parent_id = input.parentId || null;
  if (input.sortOrder !== undefined) patch.sort_order = input.sortOrder;
  if (input.isActive !== undefined) patch.is_active = input.isActive;
  if (input.isArchived !== undefined) patch.is_archived = input.isArchived;

  const { data, error } = await supabase
    .from('categories')
    .update(patch)
    .eq('id', categoryId)
    .select('*')
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? 'No se pudo actualizar la categoría.');
  }

  await supabase.from('audit_logs').insert({
    store_id: storeId,
    action: 'category.update',
    entity_type: 'category',
    entity_id: categoryId,
    metadata: patch
  });

  return data as CategoryRow;
}

export async function deleteCategory(categoryId: string, storeId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from('categories').delete().eq('id', categoryId);
  if (error) {
    throw new Error(`No se pudo eliminar la categoría: ${error.message}`);
  }
  await supabase.from('audit_logs').insert({
    store_id: storeId,
    action: 'category.delete',
    entity_type: 'category',
    entity_id: categoryId,
    metadata: {}
  });
}
