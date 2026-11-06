import React from 'react';
import type { InventoryMode, ManualAvailability, MovementType } from '@pequemodas/schemas';
import type { ProductDetailDto } from '@pequemodas/shared';
import { Alert, Button, Input, Modal, Select } from '@pequemodas/ui';

export function InventoryMovementModal({
  targetLabel,
  isOpen,
  onClose,
  movementType,
  onMovementTypeChange,
  quantity,
  onQuantityChange,
  reason,
  onReasonChange,
  busy,
  onSubmit
}: {
  targetLabel?: string;
  isOpen: boolean;
  onClose: () => void;
  movementType: MovementType;
  onMovementTypeChange: (next: MovementType) => void;
  quantity: number;
  onQuantityChange: (next: number) => void;
  reason: string;
  onReasonChange: (next: string) => void;
  busy: boolean;
  onSubmit: (e: React.FormEvent) => void;
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Movimiento de Inventario"
      description={targetLabel}
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Select
          label="Tipo de operación"
          value={movementType}
          onChange={(e) => onMovementTypeChange(e.target.value as MovementType)}
          options={[
            { value: 'in', label: 'Entrada (+ sumar unidades)' },
            { value: 'out', label: 'Salida (- descontar unidades vendidas)' },
            { value: 'adjustment', label: 'Ajuste exacto (= fijar cantidad total)' }
          ]}
        />
        <Input
          label="Cantidad"
          type="number"
          min="0"
          requiredMark
          value={quantity}
          onChange={(e) => onQuantityChange(Math.max(0, parseInt(e.target.value || '0', 10)))}
        />
        <Input
          label="Motivo"
          requiredMark
          placeholder="Ej. Reposición de mercancía o venta confirmada"
          value={reason}
          onChange={(e) => onReasonChange(e.target.value)}
        />
        <Button type="submit" fullWidth isLoading={busy}>
          Confirmar movimiento
        </Button>
      </form>
    </Modal>
  );
}

export function SwitchInventoryModeModal({
  product,
  onClose,
  manualStatus,
  onManualStatusChange,
  busy,
  onConfirm
}: {
  product: ProductDetailDto | null;
  onClose: () => void;
  manualStatus: ManualAvailability;
  onManualStatusChange: (next: ManualAvailability) => void;
  busy: boolean;
  onConfirm: () => void;
}) {
  const currentMode: InventoryMode | null = product?.inventory_mode ?? null;

  return (
    <Modal
      isOpen={Boolean(product)}
      onClose={onClose}
      title="Confirmar cambio de modalidad de inventario"
    >
      {product && (
        <div className="space-y-4">
          <Alert variant="warning" title="¿Qué sucede con los datos anteriores?">
            {currentMode === 'quantity' ? (
              <span>
                Al cambiar a <strong>Disponibilidad Manual</strong>, las cantidades actuales y
                todo su historial de movimientos <strong>se conservan intactos</strong> en la
                base de datos, pero la tienda pública mostrará el estado manual que elijas.
              </span>
            ) : (
              <span>
                Al volver a <strong>Control por Cantidades</strong>, la disponibilidad en la
                tienda se calculará automáticamente según las unidades registradas (sin permitir
                números negativos).
              </span>
            )}
          </Alert>

          {currentMode === 'quantity' && (
            <Select
              label="Estado manual inicial a mostrar"
              value={manualStatus}
              onChange={(e) => onManualStatusChange(e.target.value as ManualAvailability)}
              options={[
                { value: 'available', label: 'Disponible' },
                { value: 'inquire', label: 'Consultar disponibilidad' },
                { value: 'out_of_stock', label: 'Agotado' }
              ]}
            />
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button isLoading={busy} onClick={onConfirm}>
              Confirmar cambio
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
