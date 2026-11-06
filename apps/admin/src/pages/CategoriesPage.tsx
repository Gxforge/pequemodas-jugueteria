import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Archive, ArrowDown, ArrowUp, Edit2, FolderPlus, Trash2 } from 'lucide-react';
import { categoryFormSchema, type CategoryFormInput } from '@pequemodas/schemas';
import {
  buildCategoryTree,
  createCategory,
  deleteCategory,
  fetchCategories,
  updateCategory,
  type CategoryRow
} from '@pequemodas/shared';
import { Alert, Badge, Button, Card, EmptyState, Input, Modal, Select, Textarea } from '@pequemodas/ui';
import { slugify } from '@pequemodas/utils';
import { useAuth } from '../context/AuthContext';

export function CategoriesPage() {
  const { store } = useAuth();
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CategoryRow | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => fetchCategories({ includeArchived: true })
  });

  const tree = buildCategoryTree(categories.filter((c) => !c.is_archived));
  const archived = categories.filter((c) => c.is_archived);
  const rootOptions = [
    { value: '', label: 'Categoría principal (nivel superior)' },
    ...categories
      .filter((c) => c.parent_id === null && !c.is_archived && c.id !== editing?.id)
      .map((c) => ({ value: c.id, label: `Subcategoría de: ${c.name}` }))
  ];

  const form = useForm<CategoryFormInput>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      parentId: null,
      sortOrder: 0,
      isActive: true,
      isArchived: false
    }
  });

  const openCreate = (parentId: string | null = null) => {
    setEditing(null);
    form.reset({
      name: '',
      slug: '',
      description: '',
      parentId,
      sortOrder: categories.length,
      isActive: true,
      isArchived: false
    });
    setModalOpen(true);
  };

  const openEdit = (cat: CategoryRow) => {
    setEditing(cat);
    form.reset({
      name: cat.name,
      slug: cat.slug,
      description: cat.description ?? '',
      parentId: cat.parent_id,
      sortOrder: cat.sort_order,
      isActive: cat.is_active,
      isArchived: cat.is_archived
    });
    setModalOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async (values: CategoryFormInput) => {
      if (!store) throw new Error('Tienda no inicializada.');
      const payload = { ...values, parentId: values.parentId || null };
      return editing
        ? updateCategory(editing.id, store.id, payload)
        : createCategory(store.id, payload);
    },
    onSuccess: () => {
      setModalOpen(false);
      setActionError(null);
      void queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
    },
    onError: (err) => {
      setActionError(err instanceof Error ? err.message : 'Error al guardar categoría.');
    }
  });

  const quickPatch = async (cat: CategoryRow, patch: Partial<CategoryFormInput>) => {
    if (!store) return;
    try {
      await updateCategory(cat.id, store.id, patch);
      void queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Error al actualizar.');
    }
  };

  const handleDelete = async (cat: CategoryRow) => {
    if (!store) return;
    if (!window.confirm(`¿Eliminar "${cat.name}"? Los productos conservarán sus datos.`)) return;
    try {
      await deleteCategory(cat.id, store.id);
      void queryClient.invalidateQueries({ queryKey: ['admin-categories'] });
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'No se pudo eliminar.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-slate-900">
            Categorías y Subcategorías
          </h1>
          <p className="text-sm text-slate-600">
            Organiza la tienda en secciones claras (ej. Juguetes, Ropa de Niña, Bebés).
          </p>
        </div>
        <Button leftIcon={<FolderPlus className="h-4 w-4" />} onClick={() => openCreate(null)}>
          Nueva categoría
        </Button>
      </div>

      {actionError && <Alert variant="error">{actionError}</Alert>}

      {!isLoading && tree.length === 0 ? (
        <EmptyState
          title="Aún no has creado categorías"
          description="Crea categorías y subcategorías para que los padres encuentren rápido lo que buscan."
          primaryAction={
            <Button onClick={() => openCreate(null)}>Crear primera categoría</Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {tree.map((root, idx) => (
            <Card key={root.id} className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-heading text-base font-bold text-slate-900">
                    {root.name}
                  </span>
                  <Badge tone={root.is_active ? 'success' : 'neutral'}>
                    {root.is_active ? 'Visible' : 'Oculta'}
                  </Badge>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label="Subir orden"
                    disabled={idx === 0}
                    onClick={() => void quickPatch(root, { sortOrder: Math.max(0, root.sort_order - 1) })}
                  >
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label="Bajar orden"
                    onClick={() => void quickPatch(root, { sortOrder: root.sort_order + 1 })}
                  >
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => openCreate(root.id)}>
                    + Subcategoría
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => openEdit(root)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => void quickPatch(root, { isArchived: true })}
                  >
                    <Archive className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => void handleDelete(root)}>
                    <Trash2 className="h-4 w-4 text-rose-600" />
                  </Button>
                </div>
              </div>

              {root.subcategories.length > 0 && (
                <div className="pl-4 border-l-2 border-brand-100 space-y-2">
                  {root.subcategories.map((sub) => (
                    <div
                      key={sub.id}
                      className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2 text-sm"
                    >
                      <span className="font-medium text-slate-800">{sub.name}</span>
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(sub)}>
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => void handleDelete(sub)}>
                          <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {archived.length > 0 && (
        <Card className="space-y-2">
          <h2 className="font-heading text-sm font-bold text-slate-700">Archivadas</h2>
          {archived.map((cat) => (
            <div key={cat.id} className="flex items-center justify-between text-sm py-1">
              <span className="text-slate-600">{cat.name}</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => void quickPatch(cat, { isArchived: false })}
              >
                Restaurar
              </Button>
            </div>
          ))}
        </Card>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Editar categoría' : 'Nueva categoría'}
      >
        <form onSubmit={form.handleSubmit((v) => saveMutation.mutate(v))} className="space-y-4">
          <Input
            label="Nombre"
            requiredMark
            error={form.formState.errors.name?.message}
            {...form.register('name', {
              onChange: (e) => {
                if (!editing) {
                  form.setValue('slug', slugify(e.target.value), { shouldValidate: true });
                }
              }
            })}
          />
          <Input
            label="Identificador URL (slug)"
            requiredMark
            error={form.formState.errors.slug?.message}
            {...form.register('slug')}
          />
          <Select
            label="Ubicación"
            options={rootOptions}
            value={form.watch('parentId') ?? ''}
            onChange={(e) => form.setValue('parentId', e.target.value || null)}
          />
          <Textarea label="Descripción opcional" {...form.register('description')} />
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input type="checkbox" className="h-4 w-4 rounded" {...form.register('isActive')} />
            Visible en la tienda pública
          </label>
          <Button type="submit" fullWidth isLoading={saveMutation.isPending}>
            {editing ? 'Guardar cambios' : 'Crear categoría'}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
