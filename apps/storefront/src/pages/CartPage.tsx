import React from 'react';
import { Link } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { Button, Card, EmptyState } from '@pequemodas/ui';
import { formatCup, roundMoney } from '@pequemodas/utils';
import { WhatsAppCheckoutCard } from '../components/WhatsAppCheckoutCard';
import { useCart } from '../context/CartContext';
import { usePageMeta } from '../hooks/usePageMeta';

export function CartPage() {
  usePageMeta('Carrito de Pedido', 'Revisa tus productos seleccionados y envía tu solicitud por WhatsApp.');
  const { items, estimatedTotalCup, updateQuantity, removeItem, clearCart } = useCart();

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900">
          Tu Carrito de Pedido
        </h1>
        {items.length > 0 && (
          <Button size="sm" variant="ghost" onClick={clearCart}>
            Vaciar carrito
          </Button>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="h-8 w-8" />}
          title="Tu carrito está vacío"
          description="Explora nuestro catálogo infantil, selecciona variantes y añádelas aquí para preparar tu mensaje de WhatsApp."
          primaryAction={
            <Link to="/catalogo">
              <Button>Explorar catálogo</Button>
            </Link>
          }
          secondaryAction={
            <Link to="/informacion-pedidos">
              <Button variant="outline">Cómo hacer un pedido</Button>
            </Link>
          }
        />
      ) : (
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 space-y-3">
            {items.map((item) => {
              const subtotal = roundMoney(item.unitPriceCup * item.quantity);
              const attrs = Object.entries(item.attributes)
                .map(([k, v]) => `${k}: ${v}`)
                .join(' · ');

              return (
                <Card key={item.key} className="flex gap-3.5 items-center">
                  <div className="h-20 w-20 rounded-xl bg-slate-100 overflow-hidden shrink-0">
                    {item.thumbnailUrl ? (
                      <img
                        src={item.thumbnailUrl}
                        alt={item.productName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-xs text-slate-400">
                        Sin foto
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0 space-y-1">
                    <Link
                      to={`/producto/${item.productSlug}`}
                      className="font-heading font-bold text-slate-900 hover:text-brand-600 line-clamp-1"
                    >
                      {item.productName}
                    </Link>
                    {item.variantName && (
                      <p className="text-xs font-semibold text-sky-700">{item.variantName}</p>
                    )}
                    {attrs && <p className="text-xs text-slate-500">{attrs}</p>}
                    <p className="text-xs text-slate-500">
                      Unitario: {formatCup(item.unitPriceCup)} ·{' '}
                      <strong className="text-brand-600">Subtotal: {formatCup(subtotal)}</strong>
                    </p>

                    <div className="flex items-center gap-2 pt-1">
                      <div className="inline-flex items-center rounded-xl border border-slate-200 bg-slate-50">
                        <button
                          type="button"
                          aria-label="Disminuir cantidad"
                          onClick={() => updateQuantity(item.key, item.quantity - 1)}
                          className="p-1.5 text-slate-600"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="px-2.5 text-xs font-bold">{item.quantity}</span>
                        <button
                          type="button"
                          aria-label="Aumentar cantidad"
                          onClick={() => updateQuantity(item.key, item.quantity + 1)}
                          className="p-1.5 text-slate-600"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <button
                        type="button"
                        aria-label="Quitar producto"
                        onClick={() => removeItem(item.key)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="lg:col-span-5">
            <WhatsAppCheckoutCard items={items} estimatedTotalCup={estimatedTotalCup} />
          </div>
        </div>
      )}
    </div>
  );
}
