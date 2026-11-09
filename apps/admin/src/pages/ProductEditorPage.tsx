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
import { Alert, Button } from '@pequemodas/ui';
import { PhotosManagerSection } from '../components/PhotosManagerSection';
import { ProductMainFields } from '../components/ProductMainFields';
import { VariantsEditorSection } from '../components/VariantsEditorSection';
import { useAuth } from '../context/AuthContext';

export function ProductEditorPage() {
  const { productId } = useParams<{ productId: string }>();
  const isEditing = Boolean(productId);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { store, settings } = useAuth();

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
      currencyCode: settings?.default_currency_code ?? 'CUP',
      categoryId: null,
      subcategoryId: null,
      inventoryMode: 'quantity',
      manualAvailability: 'available',
      stockQuantity: 0,
      publicationStatus: 'draft',
      isFeatured: false
    }
  });

  // Si los ajustes llegan un instante después, adopta la moneda principal
  // sin sobrescribir una elección que Katia ya haya tocado en este formulario.
  useEffect(() => {
    if (isEditing || !settings?.default_currency_code) return;
    if (form.formState.touchedFields.currencyCode) return;
    form.setValue('currencyCode', settings.default_currency_code);
  }, [isEditing, settings?.default_currency_code, form]);

  useEffect(() => {
    if (!existingProduct) return;
    form.reset({
      name: existingProduct.name,
      slug: existingProduct.slug,
      description: existingProduct.description ?? '',
      basePriceCup: existingProduct.base_price_cup,
      currencyCode: existingProduct.currency_code ?? 'CUP',
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
        <ProductMainFields
          form={form}
          isEditing={isEditing}
          categories={categories}
          variantsCount={variants.length}
        />

        <VariantsEditorSection
          inventoryMode={form.watch('inventoryMode')}
          currencyCode={form.watch('currencyCode')}
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

        <div className="sticky bottom-4 z-20 flex justify-end">
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
