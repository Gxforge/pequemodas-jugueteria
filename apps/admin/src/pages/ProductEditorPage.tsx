import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Save } from 'lucide-react';
import {
  productFormSchema,
  type ProductFormInput,
  type ProductVariantInput
} from '@pequemodas/schemas';
import {
  createProductWithVariants,
  fetchCategories,
  fetchProductById,
  getRootInventoryQuantity,
  updateProductWithVariants
} from '@pequemodas/shared';
import { Alert, Button, Card, Input, Select, Textarea } from '@pequemodas/ui';
import { slugify } from '@pequemodas/utils';
import { PhotosManagerSection } from '../components/PhotosManagerSection';
import { VariantsEditorSection } from '../components/VariantsEditorSection';
import { useAuth } from '../context/AuthContext';

export function ProductEditorPage() {
  const { productId } = useParams<{ productId: string }>();
  const isEditing = Boolean(productId);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { store } = useAuth();

  const [variants, setVariants] = useState<ProductVariantInput[]>([]);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  const { data: categories = [] } = useQuery({
    queryKey: ['admin-categories'],
    queryFn: () => fetchCategories({ includeArchived: false })
  });

  const { data: existingProduct, refetch: refetchProduct } = useQuery({
    queryKey: ['admin-product-detail', productId],
    queryFn: () => (productId ? fetchProductById(productId) : Promise.resolve(null)),
    enabled: isEditing
  });

  const form = useForm<ProductFormInput>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      basePriceCup: 0,
      categoryId: null,
      subcategoryId: null,
      inventoryMode: 'quantity',
      manualAvailability: 'available',
      stockQuantity: 0,
      publicationStatus: 'draft',
      isFeatured: false
    }
  });

  useEffect(() => {
    if (!existingProduct) return;
    form.reset({
      name: existingProduct.name,
      slug: existingProduct.slug,
      description: existingProduct.description ?? '',
      basePriceCup: existingProduct.base_price_cup,
      categoryId: existingProduct.category_id,
      subcategoryId: existingProduct.subcategory_id,
      inventoryMode: existingProduct.inventory_mode,
      manualAvailability: existingProduct.manual_availability,
      stockQuantity: getRootInventoryQuantity(existingProduct.inventory),
      publicationStatus: existingProduct.publication_status,
      isFeatured: existingProduct.is_featured
    });
    setVariants(
      existingProduct.variants.map((v, idx) => {
        const inv = existingProduct.inventory.find((i) => i.variant_id === v.id);
        return {
          id: v.id,
          name: v.name,
          sku: v.sku ?? '',
          attributes: v.attributes,
          priceOverrideCup: v.price_override_cup,
          stockQuantity: inv?.quantity ?? 0,
          manualAvailability: v.manual_availability,
          isActive: v.is_active,
          sortOrder: idx
        };
      })
    );
  }, [existingProduct, form]);

  const selectedCategoryId = form.watch('categoryId');
  const selectedInventoryMode = form.watch('inventoryMode');

  const rootCategories = categories.filter((c) => c.parent_id === null);
  const subcategories = categories.filter(
    (c) => selectedCategoryId && c.parent_id === selectedCategoryId
  );

  const onSubmit = async (values: ProductFormInput) => {
    if (!store) return;
    setSaveError(null);
    setSaveMessage(null);
    try {
      const payload = {
        ...values,
        categoryId: values.categoryId || null,
        subcategoryId: values.subcategoryId || null
      };
      if (isEditing && productId) {
        await updateProductWithVariants(productId, store.id, payload, variants);
        await refetchProduct();
        setSaveMessage('Producto guardado correctamente.');
      } else {
        const created = await createProductWithVariants(store.id, payload, variants);
        void queryClient.invalidateQueries({ queryKey: ['admin-products'] });
        navigate(`/productos/${created.id}`, { replace: true });
      }
      void queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Error al guardar el producto.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link to="/productos">
            <Button variant="ghost" size="sm" leftIcon={<ArrowLeft className="h-4 w-4" />}>
              Volver
            </Button>
          </Link>
          <h1 className="font-heading text-xl sm:text-2xl font-extrabold text-slate-900">
            {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
          </h1>
        </div>
      </div>

      {saveMessage && <Alert variant="success">{saveMessage}</Alert>}
      {saveError && <Alert variant="error">{saveError}</Alert>}

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
        <Card className="space-y-4">
          <h2 className="font-heading text-lg font-bold text-slate-900">
            Información Principal
          </h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <Input
              label="Nombre del producto"
              requiredMark
              error={form.formState.errors.name?.message}
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
              error={form.formState.errors.slug?.message}
              {...form.register('slug')}
            />
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <Input
              label="Precio base (CUP)"
              type="number"
              min="0"
              step="0.01"
              requiredMark
              error={form.formState.errors.basePriceCup?.message}
              {...form.register('basePriceCup')}
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

          <Textarea
            label="Descripción detallada"
            rows={4}
            placeholder="Materiales, edades recomendadas, medidas o detalles importantes..."
            error={form.formState.errors.description?.message}
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
            {variants.length === 0 &&
              (selectedInventoryMode === 'quantity' ? (
                <Input
                  label="Cantidad disponible"
                  type="number"
                  min="0"
                  error={form.formState.errors.stockQuantity?.message}
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

        <VariantsEditorSection
          inventoryMode={selectedInventoryMode}
          variants={variants}
          onChange={setVariants}
        />

        <PhotosManagerSection
          productId={productId ?? null}
          images={existingProduct?.images ?? []}
          onChanged={async () => {
            await refetchProduct();
          }}
        />

        <div className="sticky bottom-20 lg:bottom-4 z-20 flex justify-end">
          <Button
            type="submit"
            size="lg"
            isLoading={form.formState.isSubmitting}
            leftIcon={<Save className="h-4 w-4" />}
          >
            {isEditing ? 'Guardar todos los cambios' : 'Guardar y continuar a fotos'}
          </Button>
        </div>
      </form>
    </div>
  );
}
