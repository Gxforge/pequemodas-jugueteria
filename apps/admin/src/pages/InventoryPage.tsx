import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeftRight, History, PlusCircle } from 'lucide-react';
import type { InventoryMode, ManualAvailability, MovementType } from '@pequemodas/schemas';
import {
  fetchInventoryMovements,
  fetchProductsPaginated,
  getRootInventoryQuantity,
  getVariantInventoryQuantity,
  recordInventoryMovement,
  resolveProductAvailability,
  switchProductInventoryMode,
  type ProductDetailDto
} from '@pequemodas/shared';
import { Alert, AvailabilityBadge, Badge, Button, Card, EmptyState } from '@pequemodas/ui';
import { formatDateTimeEs } from '@pequemodas/utils';
import {
  InventoryMovementModal,
  SwitchInventoryModeModal
} from '../components/InventoryModals';
import { useAuth } from '../context/AuthContext';

export function InventoryPage() {
  const { store } = useAuth();
  const queryClient = useQueryClient();
  const [movTarget, setMovTarget] = useState<{
    product: ProductDetailDto;
    variantId: string | null;
    label: string;
  } | null>(null);
  const [movementType, setMovementType] = useState<MovementType>('in');
  const [quantity, setQuantity] = useState(1);
  const [reason, setReason] = useState('');
  const [switchTarget, setSwitchTarget] = useState<ProductDetailDto | null>(null);
  const [manualStatus, setManualStatus] = useState<ManualAvailability>('available');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const { data: productsData } = useQuery({
    queryKey: ['admin-inventory-products'],
    queryFn: () => fetchProductsPaginated({ publicationStatus: 'all', page: 1, pageSize: 100 })
  });

  const { data: movements = [] } = useQuery({
    queryKey: ['admin-inventory-movements'],
    queryFn: () => fetchInventoryMovements(undefined, 25)
  });

  const refreshAll = () => {
    void queryClient.invalidateQueries({ queryKey: ['admin-inventory-products'] });
    void queryClient.invalidateQueries({ queryKey: ['admin-inventory-movements'] });
    void queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    void queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
  };

  const handleSaveMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!movTarget) return;
    setError(null);
    setBusy(true);
    try {
      await recordInventoryMovement({
        productId: movTarget.product.id,
        variantId: movTarget.variantId,
        movementType,
        quantity,
        reason: reason.trim() || 'Actualización administrativa'
      });
      setMovTarget(null);
      setReason('');
      setQuantity(1);
      refreshAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrar movimiento.');
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmSwitch = async () => {
    if (!switchTarget || !store) return;
    setError(null);
    setBusy(true);
    const nextMode: InventoryMode =
      switchTarget.inventory_mode === 'quantity' ? 'manual' : 'quantity';
    try {
      await switchProductInventoryMode(store.id, {
        productId: switchTarget.id,
        targetMode: nextMode,
        manualAvailability: manualStatus,
        confirmed: true
      });
      setSwitchTarget(null);
      refreshAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cambiar modalidad.');
    } finally {
      setBusy(false);
    }
  };

  const items = productsData?.items ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-extrabold text-slate-900">
          Inventario Híbrido
        </h1>
        <p className="text-sm text-slate-600">
          Gestiona existencias por cantidades exactas o mediante disponibilidad manual.
        </p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {items.length === 0 ? (
        <EmptyState
          title="Inventario vacío"
          description="Cuando crees tus productos podrás registrar aquí entradas, salidas, ajustes y disponibilidad."
        />
      ) : (
        <div className="space-y-3">
          {items.map((product) => {
            const avail = resolveProductAvailability(product);
            return (
              <Card key={product.id} className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="font-heading font-bold text-slate-900">{product.name}</h2>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <Badge tone={product.inventory_mode === 'quantity' ? 'sky' : 'brand'}>
                        {product.inventory_mode === 'quantity'
                          ? 'Modalidad A: Cantidades'
                          : 'Modalidad B: Manual'}
                      </Badge>
                      <AvailabilityBadge status={avail.status} quantity={avail.availableQuantity} />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {product.inventory_mode === 'quantity' && product.variants.length === 0 && (
                      <Button
                        size="sm"
                        variant="secondary"
                        leftIcon={<PlusCircle className="h-4 w-4" />}
                        onClick={() =>
                          setMovTarget({
                            product,
                            variantId: null,
                            label: `${product.name} (Stock actual: ${getRootInventoryQuantity(product.inventory)})`
                          })
                        }
                      >
                        Movimiento
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      leftIcon={<ArrowLeftRight className="h-4 w-4" />}
                      onClick={() => {
                        setManualStatus(product.manual_availability);
                        setSwitchTarget(product);
                      }}
                    >
                      Cambiar modalidad
                    </Button>
                  </div>
                </div>

                {product.variants.length > 0 && (
                  <div className="divide-y divide-slate-100 border-t border-slate-100 pt-2">
                    {product.variants.map((v) => {
                      const vQty = getVariantInventoryQuantity(product.inventory, v.id);
                      return (
                        <div key={v.id} className="py-2 flex items-center justify-between text-sm gap-2">
                          <span className="font-medium text-slate-800">{v.name}</span>
                          <div className="flex items-center gap-2">
                            {product.inventory_mode === 'quantity' ? (
                              <>
                                <Badge tone={vQty > 0 ? 'success' : 'danger'}>Stock: {vQty}</Badge>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    setMovTarget({
                                      product,
                                      variantId: v.id,
                                      label: `${product.name} — ${v.name} (Actual: ${vQty})`
                                    })
                                  }
                                >
                                  Ajustar
                                </Button>
                              </>
                            ) : (
                              <AvailabilityBadge status={v.manual_availability} />
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Card className="space-y-3">
        <h2 className="font-heading text-base font-bold text-slate-900 flex items-center gap-2">
          <History className="h-4 w-4 text-brand-600" />
          Historial de Movimientos
        </h2>
        {movements.length === 0 ? (
          <p className="text-xs text-slate-500">Sin movimientos registrados todavía.</p>
        ) : (
          <div className="divide-y divide-slate-100 text-xs sm:text-sm">
            {movements.map((m) => (
              <div key={m.id} className="py-2 flex items-center justify-between gap-2">
                <div>
                  <span className="font-bold uppercase text-slate-700 mr-2">[{m.movement_type}]</span>
                  <span className="text-slate-700">{m.reason}</span>
                  <span className="text-slate-500 ml-2">
                    ({m.previous_quantity} → {m.new_quantity})
                  </span>
                </div>
                <span className="text-xs text-slate-400 shrink-0">
                  {formatDateTimeEs(m.created_at)}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <InventoryMovementModal
        targetLabel={movTarget?.label}
        isOpen={Boolean(movTarget)}
        onClose={() => setMovTarget(null)}
        movementType={movementType}
        onMovementTypeChange={setMovementType}
        quantity={quantity}
        onQuantityChange={setQuantity}
        reason={reason}
        onReasonChange={setReason}
        busy={busy}
        onSubmit={(e) => void handleSaveMovement(e)}
      />

      <SwitchInventoryModeModal
        product={switchTarget}
        onClose={() => setSwitchTarget(null)}
        manualStatus={manualStatus}
        onManualStatusChange={setManualStatus}
        busy={busy}
        onConfirm={() => void handleConfirmSwitch()}
      />
    </div>
  );
}
