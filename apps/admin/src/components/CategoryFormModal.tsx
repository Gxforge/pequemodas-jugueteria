import React, { useState } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { ImagePlus, Trash2 } from 'lucide-react';
import type { CategoryFormInput } from '@pequemodas/schemas';
import { uploadCategoryCoverImage } from '@pequemodas/shared';
import { Alert, Button, Input, Modal, Select, Textarea } from '@pequemodas/ui';
import { slugify } from '@pequemodas/utils';

export interface CategoryFormModalProps {
  isOpen: boolean;
  isEditing: boolean;
  isSaving: boolean;
  storeId: string | null;
  rootOptions: Array<{ value: string; label: string }>;
  form: UseFormReturn<CategoryFormInput>;
  onClose: () => void;
  onSubmit: (values: CategoryFormInput) => void;
}

export function CategoryFormModal({
  isOpen,
  isEditing,
  isSaving,
  storeId,
  rootOptions,
  form,
  onClose,
  onSubmit
}: CategoryFormModalProps) {
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadErr, setUploadErr] = useState<string | null>(null);
  const currentCover = form.watch('imageUrl');

  const handleCoverSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !storeId) return;

    setUploadErr(null);
    setUploadingCover(true);
    try {
      const uploaded = await uploadCategoryCoverImage(storeId, file);
      form.setValue('imageUrl', uploaded.publicUrl, { shouldDirty: true });
      form.setValue('imageStoragePath', uploaded.storagePath, { shouldDirty: true });
    } catch (err) {
      setUploadErr(
        err instanceof Error ? err.message : 'No se pudo subir la foto de portada.'
      );
    } finally {
      setUploadingCover(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Editar sección o categoría' : 'Nueva sección o categoría'}
    >
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {uploadErr && <Alert variant="error">{uploadErr}</Alert>}

        <Input
          label="Nombre de la sección"
          placeholder="Ej. Ropa Niña, Juguetes, Bebés"
          requiredMark
          error={form.formState.errors.name?.message}
          {...form.register('name', {
            onChange: (e) => {
              if (!isEditing) {
                form.setValue('slug', slugify(e.target.value), {
                  shouldValidate: true
                });
              }
            }
          })}
        />

        <Input
          label="Enlace corto (se crea automático)"
          requiredMark
          error={form.formState.errors.slug?.message}
          {...form.register('slug')}
        />

        <Select
          label="Dónde mostrar esta sección"
          options={rootOptions}
          value={form.watch('parentId') ?? ''}
          onChange={(e) => form.setValue('parentId', e.target.value || null)}
        />

        {/* Portada de referencia */}
        <div className="space-y-2 rounded-2xl border border-brand-100 bg-brand-50/40 p-3.5">
          <p className="text-xs font-bold text-slate-800">
            Imagen de portada (opcional)
          </p>
          <p className="text-[11px] text-slate-600 leading-snug">
            Esta foto decora el panel de la sección. Además, cuando subas productos a esta
            categoría, la tienda irá rotando automáticamente fotos reales cada 6 segundos.
          </p>

          {currentCover ? (
            <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-white h-36">
              <img
                src={currentCover}
                alt="Portada de categoría"
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  form.setValue('imageUrl', null, { shouldDirty: true });
                  form.setValue('imageStoragePath', null, { shouldDirty: true });
                }}
                className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-lg bg-white/95 px-2.5 py-1 text-xs font-bold text-rose-600 shadow"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Quitar
              </button>
            </div>
          ) : (
            <label className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-brand-200 bg-white px-4 py-4 text-xs font-bold text-brand-700 cursor-pointer hover:bg-brand-50 transition-colors">
              <ImagePlus className="h-4 w-4" />
              <span>
                {uploadingCover
                  ? 'Preparando y subiendo imagen...'
                  : 'Elegir foto de referencia desde tu galería'}
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                disabled={uploadingCover}
                onChange={(e) => void handleCoverSelect(e)}
                className="sr-only"
              />
            </label>
          )}
        </div>

        <Textarea
          label="Descripción breve (opcional)"
          rows={2}
          placeholder="Ej. Vestidos, conjuntos frescos y accesorios para niñas."
          {...form.register('description')}
        />

        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            className="h-4 w-4 rounded"
            {...form.register('isActive')}
          />
          Mostrar esta sección en la tienda pública
        </label>

        <Button
          type="submit"
          fullWidth
          isLoading={isSaving || uploadingCover}
        >
          {isEditing ? 'Guardar cambios' : 'Crear sección'}
        </Button>
      </form>
    </Modal>
  );
}
