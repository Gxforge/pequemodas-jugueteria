import React, { useState } from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import type { InventoryMode, ProductVariantInput } from '@pequemodas/schemas';
import { Badge, Button, Card, Input, Select } from '@pequemodas/ui';

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
  const [attrDrafts, setAttrDrafts] = useState<Record<number, { key: string; value: string }>>({});

  const addVariant = () => {
    onChange([
      ...variants,
      {
        name: '',
        sku: '',
        attributes: {},
        priceOverrideCup: null,
        stockQuantity: 0,
        manualAvailability: 'available',
        isActive: true,
        sortOrder: variants.length
      }
    ]);
  };

  const updateVariant = (idx: number, patch: Partial<ProductVariantInput>) => {
    const next = variants.map((item, i) => (i === idx ? { ...item, ...patch } : item));
    onChange(next);
  };

  const removeVariant = (idx: number) => {
    onChange(variants.filter((_, i) => i !== idx));
  };

  const addAttribute = (idx: number) => {
    const draft = attrDrafts[idx];
    if (!draft?.key.trim() || !draft?.value.trim()) return;
    const current = variants[idx];
    if (!current) return;
    updateVariant(idx, {
      attributes: {
        ...current.attributes,
        [draft.key.trim()]: draft.value.trim()
      }
    });
    setAttrDrafts((prev) => ({ ...prev, [idx]: { key: '', value: '' } }));
  };

  const removeAttribute = (idx: number, keyToRemove: string) => {
    const current = variants[idx];
    if (!current) return;
    const copy = { ...current.attributes };
    delete copy[keyToRemove];
    updateVariant(idx, { attributes: copy });
  };

  return (
    <Card className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h2 className="font-heading text-lg font-bold text-slate-900">
            Variantes Flexibles (Tallas, Colores, Modelos, Edades...)
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Opcional: añade combinaciones con atributos libres y precio o stock propio.
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={addVariant}
        >
          Añadir variante
        </Button>
      </div>

      {variants.length === 0 ? (
        <p className="text-xs text-slate-500 bg-slate-50 rounded-xl p-3">
          Este producto se vende como modelo único. Pulsa «Añadir variante» si tiene tallas,
          colores o diseños distintos.
        </p>
      ) : (
        <div className="space-y-4">
          {variants.map((variant, idx) => {
            const draft = attrDrafts[idx] ?? { key: '', value: '' };
            return (
              <div
                key={variant.id ?? `new-${idx}`}
                className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-700">
                    Variante #{idx + 1}
                  </span>
                  <Button size="sm" variant="ghost" onClick={() => removeVariant(idx)}>
                    <Trash2 className="h-4 w-4 text-rose-600" />
                  </Button>
                </div>

                <div className="grid sm:grid-cols-3 gap-3">
                  <Input
                    label="Nombre de variante"
                    placeholder="Ej. Talla 4 - Rosa"
                    requiredMark
                    value={variant.name}
                    onChange={(e) => updateVariant(idx, { name: e.target.value })}
                  />
                  <Input
                    label="Precio propio CUP (opcional)"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Usa precio base si vacío"
                    value={variant.priceOverrideCup ?? ''}
                    onChange={(e) =>
                      updateVariant(idx, {
                        priceOverrideCup: e.target.value === '' ? null : Number(e.target.value)
                      })
                    }
                  />
                  {inventoryMode === 'quantity' ? (
                    <Input
                      label="Cantidad disponible"
                      type="number"
                      min="0"
                      value={variant.stockQuantity}
                      onChange={(e) =>
                        updateVariant(idx, {
                          stockQuantity: Math.max(0, parseInt(e.target.value || '0', 10))
                        })
                      }
                    />
                  ) : (
                    <Select
                      label="Disponibilidad manual"
                      value={variant.manualAvailability}
                      onChange={(e) =>
                        updateVariant(idx, {
                          manualAvailability: e.target.value as ProductVariantInput['manualAvailability']
                        })
                      }
                      options={[
                        { value: 'available', label: 'Disponible' },
                        { value: 'inquire', label: 'Consultar disponibilidad' },
                        { value: 'out_of_stock', label: 'Agotado' }
                      ]}
                    />
                  )}
                </div>

                {/* Atributos dinámicos ilimitados */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-700">
                    Atributos personalizados (Talla, Color, Edad, Material, etc.)
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {Object.entries(variant.attributes).map(([k, v]) => (
                      <Badge key={k} tone="brand" className="pr-1">
                        <span>
                          {k}: {v}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeAttribute(idx, k)}
                          aria-label={`Quitar atributo ${k}`}
                          className="ml-1 rounded-full hover:bg-brand-200 p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <Input
                      placeholder="Atributo (ej. Talla)"
                      value={draft.key}
                      onChange={(e) =>
                        setAttrDrafts((p) => ({ ...p, [idx]: { ...draft, key: e.target.value } }))
                      }
                    />
                    <Input
                      placeholder="Valor (ej. 4 años)"
                      value={draft.value}
                      onChange={(e) =>
                        setAttrDrafts((p) => ({ ...p, [idx]: { ...draft, value: e.target.value } }))
                      }
                    />
                    <Button size="sm" variant="secondary" onClick={() => addAttribute(idx)}>
                      Guardar atributo
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
