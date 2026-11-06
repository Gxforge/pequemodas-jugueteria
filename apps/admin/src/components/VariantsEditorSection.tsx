import React, { useState } from 'react';
import { CheckCircle2, Layers, Plus } from 'lucide-react';
import type { InventoryMode, ProductVariantInput } from '@pequemodas/schemas';
import { Button, Card } from '@pequemodas/ui';
import { VariantOptionCard } from './VariantOptionCard';

interface VariantsEditorSectionProps {
  inventoryMode: InventoryMode;
  variants: ProductVariantInput[];
  onChange: (next: ProductVariantInput[]) => void;
}

export function VariantsEditorSection({
  inventoryMode,
  variants,
  onChange
}: VariantsEditorSectionProps) {
  const [detailDrafts, setDetailDrafts] = useState<
    Record<number, { key: string; value: string }>
  >({});

  const hasOptions = variants.length > 0;

  const createBlankOption = (sortOrder: number): ProductVariantInput => ({
    name: '',
    sku: '',
    attributes: {},
    priceOverrideCup: null,
    stockQuantity: 1,
    manualAvailability: 'available',
    isActive: true,
    sortOrder
  });

  const switchToSingleModel = () => {
    if (variants.length === 0) return;
    if (
      window.confirm(
        '¿Cambiar a artículo único? Se quitarán las tallas o colores agregados aquí.'
      )
    ) {
      onChange([]);
    }
  };

  const addOption = () => {
    onChange([...variants, createBlankOption(variants.length)]);
  };

  const updateOption = (idx: number, patch: Partial<ProductVariantInput>) => {
    onChange(variants.map((item, i) => (i === idx ? { ...item, ...patch } : item)));
  };

  const saveDetail = (idx: number) => {
    const draft = detailDrafts[idx];
    if (!draft?.key.trim() || !draft?.value.trim()) return;
    const current = variants[idx];
    if (!current) return;
    const nextAttrs = {
      ...current.attributes,
      [draft.key.trim()]: draft.value.trim()
    };
    const autoName =
      current.name.trim() ||
      Object.entries(nextAttrs)
        .map(([k, v]) => `${k} ${v}`)
        .join(' · ');
    updateOption(idx, { attributes: nextAttrs, name: autoName });
    setDetailDrafts((prev) => ({ ...prev, [idx]: { key: draft.key, value: '' } }));
  };

  const removeDetail = (idx: number, keyToRemove: string) => {
    const current = variants[idx];
    if (!current) return;
    const copy = { ...current.attributes };
    delete copy[keyToRemove];
    updateOption(idx, { attributes: copy });
  };

  return (
    <Card className="space-y-4">
      <div>
        <h2 className="font-heading text-lg font-bold text-slate-900">
          ¿Este producto tiene distintas tallas, colores o diseños?
        </h2>
        <p className="text-xs sm:text-sm text-slate-500">
          Elige cómo prefieres mostrarlo a tus clientes en la tienda:
        </p>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <button
          type="button"
          onClick={switchToSingleModel}
          className={`text-left rounded-2xl border p-3.5 transition-all ${
            !hasOptions
              ? 'border-brand-400 bg-brand-50/70 ring-2 ring-brand-200'
              : 'border-slate-200 bg-white hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-2 font-heading font-bold text-sm text-slate-900">
            <CheckCircle2
              className={`h-4 w-4 ${!hasOptions ? 'text-brand-600' : 'text-slate-400'}`}
            />
            Artículo único (sin tallas ni opciones)
          </div>
          <p className="mt-1 text-xs text-slate-600">
            Ideal para un juguete o accesorio que viene en una sola presentación.
          </p>
        </button>

        <button
          type="button"
          onClick={() => {
            if (!hasOptions) addOption();
          }}
          className={`text-left rounded-2xl border p-3.5 transition-all ${
            hasOptions
              ? 'border-sky-400 bg-sky-50/70 ring-2 ring-sky-200'
              : 'border-slate-200 bg-white hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-2 font-heading font-bold text-sm text-slate-900">
            <Layers
              className={`h-4 w-4 ${hasOptions ? 'text-sky-600' : 'text-slate-400'}`}
            />
            Varias opciones (Tallas, Colores, Edades...)
          </div>
          <p className="mt-1 text-xs text-slate-600">
            El cliente podrá escoger la talla, color o diseño antes de pedir.
          </p>
        </button>
      </div>

      {hasOptions && (
        <div className="space-y-4 pt-1">
          {variants.map((variant, idx) => (
            <VariantOptionCard
              key={variant.id ?? `opt-${idx}`}
              index={idx}
              inventoryMode={inventoryMode}
              variant={variant}
              draft={detailDrafts[idx] ?? { key: 'Talla', value: '' }}
              onUpdate={(patch) => updateOption(idx, patch)}
              onRemove={() => onChange(variants.filter((_, i) => i !== idx))}
              onDraftChange={(next) =>
                setDetailDrafts((p) => ({ ...p, [idx]: next }))
              }
              onSaveDetail={() => saveDetail(idx)}
              onRemoveDetail={(k) => removeDetail(idx, k)}
            />
          ))}

          <Button
            variant="outline"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={addOption}
          >
            Agregar otra talla, color o diseño
          </Button>
        </div>
      )}
    </Card>
  );
}
