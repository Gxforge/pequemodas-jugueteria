import React from 'react';
import { Sparkles, Trash2, X } from 'lucide-react';
import type { InventoryMode, ProductVariantInput } from '@pequemodas/schemas';
import { Badge, Button, Input, Select } from '@pequemodas/ui';

export const QUICK_DETAIL_PRESETS = [
  { key: 'Talla', placeholder: 'Ej. Talla 4, Recién nacido, 32' },
  { key: 'Color', placeholder: 'Ej. Rosa pastel, Azul cielo' },
  { key: 'Edad', placeholder: 'Ej. 2 a 4 años, +3 años' },
  { key: 'Diseño', placeholder: 'Ej. Unicornio, Dinosaurio' }
];

export interface VariantOptionCardProps {
  index: number;
  inventoryMode: InventoryMode;
  variant: ProductVariantInput;
  draft: { key: string; value: string };
  onUpdate: (patch: Partial<ProductVariantInput>) => void;
  onRemove: () => void;
  onDraftChange: (next: { key: string; value: string }) => void;
  onSaveDetail: () => void;
  onRemoveDetail: (key: string) => void;
}

export function VariantOptionCard({
  index,
  inventoryMode,
  variant,
  draft,
  onUpdate,
  onRemove,
  onDraftChange,
  onSaveDetail,
  onRemoveDetail
}: VariantOptionCardProps) {
  const activePreset = QUICK_DETAIL_PRESETS.find((p) => p.key === draft.key);

  return (
    <div className="rounded-2xl border border-sky-100 bg-slate-50/70 p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-sky-700">
          <Sparkles className="h-3.5 w-3.5" />
          Opción #{index + 1}
        </span>
        <Button
          size="sm"
          variant="ghost"
          aria-label={`Quitar opción ${index + 1}`}
          onClick={onRemove}
        >
          <Trash2 className="h-4 w-4 text-rose-600" />
        </Button>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <Input
          label="¿Cómo se llama esta opción?"
          placeholder="Ej. Talla 4 - Rosa"
          requiredMark
          value={variant.name}
          onChange={(e) => onUpdate({ name: e.target.value })}
        />

        {inventoryMode === 'quantity' ? (
          <Input
            label="Unidades disponibles"
            type="number"
            min="0"
            value={variant.stockQuantity}
            onChange={(e) =>
              onUpdate({
                stockQuantity: Math.max(0, parseInt(e.target.value || '0', 10))
              })
            }
          />
        ) : (
          <Select
            label="Estado de esta opción"
            value={variant.manualAvailability}
            onChange={(e) =>
              onUpdate({
                manualAvailability: e.target.value as ProductVariantInput['manualAvailability']
              })
            }
            options={[
              { value: 'available', label: 'Disponible para entrega' },
              { value: 'inquire', label: 'Consultar primero' },
              { value: 'out_of_stock', label: 'Agotada por ahora' }
            ]}
          />
        )}

        <Input
          label="Precio distinto en CUP (solo si cambia)"
          type="number"
          min="0"
          step="0.01"
          placeholder="Mismo precio principal"
          value={variant.priceOverrideCup ?? ''}
          onChange={(e) =>
            onUpdate({
              priceOverrideCup: e.target.value === '' ? null : Number(e.target.value)
            })
          }
        />
      </div>

      <div className="space-y-2 rounded-xl bg-white p-3 border border-slate-200/80">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-bold text-slate-600 mr-1">Detalle rápido:</span>
          {QUICK_DETAIL_PRESETS.map((preset) => (
            <button
              key={preset.key}
              type="button"
              onClick={() => onDraftChange({ key: preset.key, value: draft.value })}
              className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold transition-colors ${
                draft.key === preset.key
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              + {preset.key}
            </button>
          ))}
        </div>

        {Object.keys(variant.attributes).length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {Object.entries(variant.attributes).map(([k, v]) => (
              <Badge key={k} tone="brand" className="pr-1">
                <span>
                  {k}: {v}
                </span>
                <button
                  type="button"
                  onClick={() => onRemoveDetail(k)}
                  className="ml-1 rounded-full hover:bg-brand-200 p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
          <Input
            placeholder="Tipo (ej. Talla)"
            value={draft.key}
            onChange={(e) => onDraftChange({ ...draft, key: e.target.value })}
          />
          <Input
            placeholder={activePreset?.placeholder || 'Ej. 4 años'}
            value={draft.value}
            onChange={(e) => onDraftChange({ ...draft, value: e.target.value })}
          />
          <Button size="sm" variant="secondary" onClick={onSaveDetail}>
            Añadir etiqueta
          </Button>
        </div>
      </div>
    </div>
  );
}
