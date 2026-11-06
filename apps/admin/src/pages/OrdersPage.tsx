import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, MessageSquare, XCircle } from 'lucide-react';
import type { OrderStatus } from '@pequemodas/schemas';
import { fetchOrdersForAdmin, updateOrderStatusByAdmin } from '@pequemodas/shared';
import { Alert, Badge, Button, Card, EmptyState, Select } from '@pequemodas/ui';
import { formatCup, formatDateTimeEs } from '@pequemodas/utils';
import { useAuth } from '../context/AuthContext';

export function OrdersPage() {
  const { store } = useAuth();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<OrderStatus | 'all'>('all');
  const [error, setError] = useState<string | null>(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['admin-orders', filter],
    queryFn: () => fetchOrdersForAdmin(filter)
  });

  const handleStatusChange = async (orderId: string, status: OrderStatus) => {
    if (!store) return;
    setError(null);
    try {
      await updateOrderStatusByAdmin(orderId, store.id, status);
      void queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      void queryClient.invalidateQueries({ queryKey: ['admin-dashboard'] });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al actualizar estado.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl font-extrabold text-slate-900">
            Solicitudes de Pedidos por WhatsApp
          </h1>
          <p className="text-sm text-slate-600">
            Las solicitudes recibidas no descuentan inventario automáticamente hasta que tú las
            confirmes y registres la salida si corresponde.
          </p>
        </div>
        <div className="w-full sm:w-56">
          <Select
            value={filter}
            onChange={(e) => setFilter(e.target.value as OrderStatus | 'all')}
            options={[
              { value: 'all', label: 'Todas las solicitudes' },
              { value: 'request_received', label: 'Solicitudes recibidas' },
              { value: 'confirmed', label: 'Pedidos confirmados' },
              { value: 'completed', label: 'Entregados / Completados' },
              { value: 'cancelled', label: 'Cancelados' }
            ]}
          />
        </div>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {!isLoading && orders.length === 0 ? (
        <EmptyState
          icon={<MessageSquare className="h-8 w-8" />}
          title="Sin solicitudes registradas"
          description="Cuando un cliente prepare su carrito y abra WhatsApp, verás aquí la solicitud diferenciada de los pedidos ya confirmados."
        />
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-heading font-extrabold text-slate-900">
                    #{order.reference_code}
                  </span>
                  <Badge
                    tone={
                      order.status === 'request_received'
                        ? 'warning'
                        : order.status === 'confirmed'
                          ? 'sky'
                          : order.status === 'completed'
                            ? 'success'
                            : 'danger'
                    }
                  >
                    {order.status === 'request_received'
                      ? 'Solicitud recibida (sin confirmar)'
                      : order.status === 'confirmed'
                        ? 'Pedido confirmado manualmente'
                        : order.status === 'completed'
                          ? 'Completado'
                          : 'Cancelado'}
                  </Badge>
                </div>
                <span className="text-xs text-slate-500">
                  {formatDateTimeEs(order.created_at)}
                </span>
              </div>

              <div className="grid sm:grid-cols-2 gap-2 text-sm text-slate-700">
                <p>
                  <strong>Cliente:</strong> {order.customer_name}{' '}
                  {order.customer_phone ? `(${order.customer_phone})` : ''}
                </p>
                <p>
                  <strong>Modalidad:</strong>{' '}
                  {order.delivery_mode === 'delivery' ? 'Entrega a domicilio' : 'Recogida'}
                </p>
                {order.delivery_address && (
                  <p className="sm:col-span-2">
                    <strong>Dirección:</strong> {order.delivery_address}
                  </p>
                )}
              </div>

              {order.items && order.items.length > 0 && (
                <ul className="bg-slate-50 rounded-xl p-3 space-y-1 text-xs sm:text-sm">
                  {order.items.map((item) => (
                    <li key={item.id} className="flex justify-between gap-2">
                      <span>
                        {item.quantity}× {item.product_name_snapshot}
                        {item.variant_name_snapshot ? ` (${item.variant_name_snapshot})` : ''}
                      </span>
                      <span className="font-semibold">{formatCup(item.subtotal_cup)}</span>
                    </li>
                  ))}
                </ul>
              )}

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <span className="font-heading font-extrabold text-brand-600">
                  Total estimado: {formatCup(Number(order.estimated_total_cup))}
                </span>
                <div className="flex flex-wrap gap-2">
                  {order.status === 'request_received' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      leftIcon={<CheckCircle2 className="h-4 w-4" />}
                      onClick={() => void handleStatusChange(order.id, 'confirmed')}
                    >
                      Confirmar pedido
                    </Button>
                  )}
                  {order.status === 'confirmed' && (
                    <Button
                      size="sm"
                      variant="primary"
                      onClick={() => void handleStatusChange(order.id, 'completed')}
                    >
                      Marcar entregado
                    </Button>
                  )}
                  {order.status !== 'cancelled' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      leftIcon={<XCircle className="h-4 w-4 text-rose-600" />}
                      onClick={() => void handleStatusChange(order.id, 'cancelled')}
                    >
                      Cancelar
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
