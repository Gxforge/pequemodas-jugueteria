import React from 'react';
import type { UseFormReturn } from 'react-hook-form';
import type { CategoryRow } from '@pequemodas/shared';
import type { ProductFormInput } from '@pequemodas/schemas';
import { Card, Input, Select, Textarea } from '@pequemodas/ui';
import { normalizeCurrencyCode, slugify } from '@pequemodas/utils';

interface ProductMainFieldsProps {
  form: UseFormReturn<ProductFormInput>;
  isEditing: boolean;
  categories: CategoryRow[];
  variantsCount: number;
}

export function ProductMainFields({
  form,
  isEditing,
  categories,
  variantsCount
}: ProductMainFieldsProps) {
  const selectedCategoryId = form.watch('categoryId');
  const selectedInventoryMode = form.watch('inventoryMode');
  const currencyCode = normalizeCurrencyCode(form.watch('currencyCode'));
  const rootCategories = categories.filter((c) => c.parent_id === null);
  const subcategories = categories.filter(
    (c) => selectedCategoryId && c.parent_id === selectedCategoryId
  );
  const errors = form.formState.errors;

  return (
    <Card className="space-y-4">
      <h2 className="font-heading text-lg font-bold text-slate-900">
        Información Principal
      </h2>
      <div className="grid sm:grid-cols-2 gap-4">
        <Input
          label="Nombre del producto"
          requiredMark
          error={errors.name?.message}
          {...form.register('name', {
            onChange: (e) => {
              if (!isEditing) {
                form.setValue('slug', slugify(e.target.value), { shouldValidate: true });
              }
            }
          })}
        />
        <Input
          label="Identificador URL (slug)"
          requiredMark
          error={errors.slug?.message}
          {...form.register('slug')}
        />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Input
          label={`Precio base (${currencyCode})`}
          type="number"
          min="0"
          step="0.01"
          requiredMark
          error={errors.basePriceCup?.message}
          {...form.register('basePriceCup')}
        />
        <Select
          label="Moneda del precio"
          hint="CUP o USD, sin conversión"
          options={[
            { value: 'CUP', label: 'CUP · pesos cubanos' },
            { value: 'USD', label: 'USD · dólares' }
          ]}
          {...form.register('currencyCode')}
        />
        <Select
          label="Categoría"
          value={selectedCategoryId ?? ''}
          onChange={(e) => {
            form.setValue('categoryId', e.target.value || null);
            form.setValue('subcategoryId', null);
          }}
          options={[
            { value: '', label: 'Sin categoría' },
            ...rootCategories.map((c) => ({ value: c.id, label: c.name }))
          ]}
        />
        <Select
          label="Subcategoría"
          value={form.watch('subcategoryId') ?? ''}
          disabled={subcategories.length === 0}
          onChange={(e) => form.setValue('subcategoryId', e.target.value || null)}
          options={[
            { value: '', label: 'Sin subcategoría' },
            ...subcategories.map((s) => ({ value: s.id, label: s.name }))
          ]}
        />
      </div>

      <p className="text-xs font-semibold text-slate-600 bg-slate-50 rounded-xl p-3">
        Cada artículo conserva la moneda que elijas aquí. Las tallas o colores usan esa misma
        moneda, y el carrito suma CUP y USD por separado sin convertir entre ellos.
      </p>

      <Textarea
        label="Descripción detallada"
        rows={4}
        placeholder="Materiales, edades recomendadas, medidas o detalles importantes..."
        error={errors.description?.message}
        {...form.register('description')}
      />

      <div className="grid sm:grid-cols-3 gap-4">
        <Select
          label="Estado de publicación"
          options={[
            { value: 'draft', label: 'Borrador (privado)' },
            { value: 'published', label: 'Publicado en la tienda' },
            { value: 'hidden', label: 'Oculto temporalmente' },
            { value: 'archived', label: 'Archivado' }
          ]}
          {...form.register('publicationStatus')}
        />
        <Select
          label="Modalidad de inventario"
          options={[
            { value: 'quantity', label: 'Modalidad A: Por cantidades' },
            { value: 'manual', label: 'Modalidad B: Disponibilidad manual' }
          ]}
          {...form.register('inventoryMode')}
        />
        {variantsCount === 0 &&
          (selectedInventoryMode === 'quantity' ? (
            <Input
              label="Cantidad disponible"
              type="number"
              min="0"
              error={errors.stockQuantity?.message}
              {...form.register('stockQuantity')}
            />
          ) : (
            <Select
              label="Disponibilidad manual"
              options={[
                { value: 'available', label: 'Disponible' },
                { value: 'inquire', label: 'Consultar disponibilidad' },
                { value: 'out_of_stock', label: 'Agotado' }
              ]}
              {...form.register('manualAvailability')}
            />
          ))}
      </div>

      <label className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700">
        <input type="checkbox" className="h-4 w-4 rounded" {...form.register('isFeatured')} />
        Destacar en la portada de la tienda
      </label>
    </Card>
  );
}
