import React, { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, ImagePlus, Star, Trash2 } from 'lucide-react';
import { STORAGE_LIMITS } from '@pequemodas/config';
import {
  deleteProductImage,
  reorderProductImages,
  setPrimaryProductImage,
  uploadProductPhotograph,
  type ProductImageRow
} from '@pequemodas/shared';
import { Alert, Badge, Button, Card } from '@pequemodas/ui';

interface PhotosManagerSectionProps {
  productId: string | null;
  images: ProductImageRow[];
  onChanged: () => Promise<void>;
}

export function PhotosManagerSection({
  productId,
  images,
  onChanged
}: PhotosManagerSectionProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progressText, setProgressText] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0 || !productId) return;

    const files = Array.from(fileList);
    if (images.length + files.length > STORAGE_LIMITS.maxImagesPerProduct) {
      setError(`Máximo ${STORAGE_LIMITS.maxImagesPerProduct} fotografías por producto.`);
      e.target.value = '';
      return;
    }

    setError(null);
    setUploading(true);
    try {
      for (let i = 0; i < files.length; i += 1) {
        const file = files[i];
        if (!file) continue;
        setProgressText(`Optimizando y subiendo foto ${i + 1} de ${files.length}...`);
        await uploadProductPhotograph({
          productId,
          file,
          isPrimary: images.length === 0 && i === 0,
          sortOrder: images.length + i
        });
      }
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir fotografías.');
    } finally {
      setUploading(false);
      setProgressText(null);
      e.target.value = '';
    }
  };

  const handleSetPrimary = async (imageId: string) => {
    if (!productId) return;
    setError(null);
    try {
      await setPrimaryProductImage(productId, imageId);
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo cambiar la foto principal.');
    }
  };

  const handleMove = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    const copy = [...images];
    const [moved] = copy.splice(index, 1);
    if (!moved) return;
    copy.splice(target, 0, moved);
    await reorderProductImages(copy.map((img) => img.id));
    await onChanged();
  };

  const handleDelete = async (img: ProductImageRow) => {
    if (!window.confirm('¿Eliminar esta fotografía de la tienda?')) return;
    setError(null);
    try {
      await deleteProductImage(img);
      await onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al eliminar la fotografía.');
    }
  };

  return (
    <Card className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="font-heading text-lg font-bold text-slate-900">
            Fotografías del Producto
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Selecciona imágenes desde tu teléfono Android o PC (JPG, PNG o WebP, máx. 5 MB).
          </p>
        </div>

        {productId && (
          <>
            <input
              ref={inputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              className="hidden"
              onChange={(e) => void handleFilesSelected(e)}
            />
            <Button
              size="sm"
              variant="secondary"
              isLoading={uploading}
              leftIcon={<ImagePlus className="h-4 w-4" />}
              onClick={() => inputRef.current?.click()}
            >
              Subir fotos
            </Button>
          </>
        )}
      </div>

      {!productId && (
        <Alert variant="info">
          Guarda primero los datos básicos del producto para habilitar la carga de fotografías.
        </Alert>
      )}

      {progressText && <Alert variant="info">{progressText}</Alert>}
      {error && <Alert variant="error">{error}</Alert>}

      {productId && images.length === 0 && !uploading && (
        <p className="text-xs text-slate-500 bg-slate-50 rounded-xl p-4 text-center">
          Aún no hay fotografías cargadas para este producto.
        </p>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {images.map((img, idx) => (
            <div
              key={img.id}
              className="rounded-2xl border border-slate-200 bg-white overflow-hidden flex flex-col"
            >
              <div className="relative aspect-square bg-slate-100">
                <img
                  src={img.thumbnail_url ?? img.public_url}
                  alt={img.alt_text ?? 'Producto'}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                {img.is_primary && (
                  <div className="absolute top-2 left-2">
                    <Badge tone="sunny">Principal</Badge>
                  </div>
                )}
              </div>
              <div className="p-2 flex items-center justify-between gap-1 bg-slate-50">
                <button
                  type="button"
                  onClick={() => void handleSetPrimary(img.id)}
                  title="Marcar como principal"
                  className={`p-1.5 rounded-lg ${
                    img.is_primary ? 'text-amber-500' : 'text-slate-400 hover:text-amber-500'
                  }`}
                >
                  <Star className="h-4 w-4 fill-current" />
                </button>
                <div className="flex items-center gap-0.5">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={() => void handleMove(idx, -1)}
                    aria-label="Mover antes"
                    className="p-1.5 rounded-lg text-slate-500 disabled:opacity-30"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={idx === images.length - 1}
                    onClick={() => void handleMove(idx, 1)}
                    aria-label="Mover después"
                    className="p-1.5 rounded-lg text-slate-500 disabled:opacity-30"
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => void handleDelete(img)}
                    aria-label="Eliminar foto"
                    className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
