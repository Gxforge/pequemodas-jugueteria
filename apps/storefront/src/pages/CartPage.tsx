import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Minus, Plus, ShoppingBag, Smartphone, Trash2 } from 'lucide-react';
import { Button, Card, EmptyState } from '@pequemodas/ui';
import { formatCup, roundMoney } from '@pequemodas/utils';
import { DirectAppCheckoutCard } from '../components/DirectAppCheckoutCard';
import { WhatsAppCheckoutCard } from '../components/WhatsAppCheckoutCard';
import { useCart } from '../context/CartContext';
import { usePageMeta } from '../hooks/usePageMeta';

export function CartPage() {
  usePageMeta(
    'Carrito de Pedido',
    'Elige comprar directo en la aplicación con chat en vivo o solicitar por WhatsApp.'
  );
  const { items, estimatedTotalCup, updateQuantity, removeItem, clearCart } = useCart();
  const [checkoutChannel, setCheckoutChannel] = useState<'app' | 'whatsapp'>('app');
  const [justSubmittedInApp, setJustSubmittedInApp] = useState(false);

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

      {items.length === 0 && !justSubmittedInApp ? (
        <EmptyState
          icon={<ShoppingBag className="h-8 w-8" />}
          title="Tu carrito está vacío"
          description="Explora nuestro catálogo infantil, elige tus prendas o juguetes favoritos y compra directo en la App o por WhatsApp."
          primaryAction={
            <Link to="/catalogo">
              <Button>Explorar catálogo</Button>
            </Link>
          }
          secondaryAction={
            <Button
              variant="outline"
              leftIcon={<MessageCircle className="h-4 w-4" />}
              onClick={() => window.dispatchEvent(new CustomEvent('pequemodas:open-chat'))}
            >
              Abrir chat con la tienda
            </Button>
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
                      <strong className="text-brand-600">
                        Subtotal: {formatCup(subtotal)}
                      </strong>
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

          <div className="lg:col-span-5 space-y-3">
            {/* Selector Dual: Compra en la App vs WhatsApp Externo */}
            <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white p-1.5 border border-brand-100 shadow-sm">
              <button
                type="button"
                onClick={() => setCheckoutChannel('app')}
                className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 px-3 text-xs sm:text-sm font-extrabold transition-all ${
                  checkoutChannel === 'app'
                    ? 'bg-brand-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Smartphone className="h-4 w-4 shrink-0" />
                <span>Aquí en la App</span>
              </button>
              <button
                type="button"
                onClick={() => setCheckoutChannel('whatsapp')}
                className={`flex items-center justify-center gap-1.5 rounded-xl py-2.5 px-3 text-xs sm:text-sm font-extrabold transition-all ${
                  checkoutChannel === 'whatsapp'
                    ? 'bg-whatsapp-600 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <MessageCircle className="h-4 w-4 shrink-0" />
                <span>Por WhatsApp</span>
              </button>
            </div>

            {checkoutChannel === 'app' ? (
              <DirectAppCheckoutCard
                items={items}
                estimatedTotalCup={estimatedTotalCup}
                onOrderCompleted={() => {
                  setJustSubmittedInApp(true);
                  clearCart();
                }}
              />
            ) : (
              <WhatsAppCheckoutCard
                items={items}
                estimatedTotalCup={estimatedTotalCup}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
