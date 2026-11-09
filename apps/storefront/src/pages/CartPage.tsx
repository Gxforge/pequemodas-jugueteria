import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  CheckCircle2,
  MessageCircle,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Sparkles,
  Trash2
} from 'lucide-react';
import { Button } from '@pequemodas/ui';
import { formatMoney, roundMoney } from '@pequemodas/utils';
import { CurrencyTotals } from '../components/CurrencyTotals';
import { DirectAppCheckoutCard } from '../components/DirectAppCheckoutCard';
import { WhatsAppCheckoutCard } from '../components/WhatsAppCheckoutCard';
import { useCart } from '../context/CartContext';
import { usePageMeta } from '../hooks/usePageMeta';

export function CartPage() {
  usePageMeta(
    'Tu Bolsita de Pedido',
    'Elige comprar directo en la aplicación con chat en vivo o solicitar por WhatsApp.'
  );
  const { items, totalQuantity, totalsByCurrency, updateQuantity, removeItem, clearCart } =
    useCart();
  const [checkoutChannel, setCheckoutChannel] = useState<'app' | 'whatsapp'>('app');
  const [justSubmittedInApp, setJustSubmittedInApp] = useState(false);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-6">
      {/* Cabecera de Carrito con Pasos Visuales */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-extrabold text-slate-900 flex items-center gap-2.5">
            <span>Tu Carrito de Pedido</span>
            {totalQuantity > 0 && (
              <span className="rounded-full bg-brand-100 text-brand-700 px-3 py-0.5 text-sm font-extrabold">
                {totalQuantity} {totalQuantity === 1 ? 'artículo' : 'artículos'}
              </span>
            )}
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-slate-500 mt-1.5">
            <span className="text-brand-600">① Revisa tu bolsita</span>
            <span>→</span>
            <span className={items.length > 0 ? 'text-sky-700' : ''}>② Elige entrega</span>
            <span>→</span>
            <span>③ Katia te confirma</span>
          </div>
        </div>

        {items.length > 0 && (
          <Button
            size="sm"
            variant="ghost"
            leftIcon={<Trash2 className="h-4 w-4 text-rose-500" />}
            onClick={clearCart}
          >
            Vaciar bolsita
          </Button>
        )}
      </div>

      {justSubmittedInApp && items.length === 0 ? (
        <div className="rounded-3xl bg-gradient-to-br from-emerald-50 via-white to-sky-50 border border-emerald-200 p-8 text-center space-y-4 shadow-card max-w-xl mx-auto">
          <div className="h-16 w-16 rounded-3xl bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md">
            <CheckCircle2 className="h-9 w-9" />
          </div>
          <h2 className="font-heading text-2xl font-extrabold text-slate-900">
            ¡Tu pedido ya se envió a Katia!
          </h2>
          <p className="text-sm text-slate-600">
            Abrimos tu conversación en vivo para coordinar la entrega directamente contigo.
          </p>
          <div className="flex flex-wrap justify-center gap-2.5 pt-2">
            <Button
              onClick={() => window.dispatchEvent(new CustomEvent('pequemodas:open-chat'))}
              leftIcon={<MessageCircle className="h-4 w-4" />}
            >
              Ver mi chat con Katia
            </Button>
            <Link to="/catalogo">
              <Button variant="outline">Seguir mirando tienda</Button>
            </Link>
          </div>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl bg-gradient-to-br from-brand-50/70 via-white to-sky-50/70 border border-brand-100 p-8 sm:p-10 text-center space-y-5 shadow-card max-w-2xl mx-auto">
          <div className="relative mx-auto h-24 w-24 rounded-3xl bg-gradient-to-tr from-brand-100 to-sky-100 flex items-center justify-center shadow-inner">
            <ShoppingBag className="h-11 w-11 text-brand-600" />
            <span className="absolute -top-2 -right-2 h-8 w-8 rounded-2xl bg-amber-400 text-white flex items-center justify-center shadow">
              <Sparkles className="h-4 w-4" />
            </span>
          </div>

          <div className="space-y-1.5 max-w-md mx-auto">
            <h2 className="font-heading text-xl sm:text-2xl font-extrabold text-slate-900">
              Tu carrito está vacío
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Agrega tus prendas o juguetes favoritos en CUP o USD y pide en segundos desde aquí mismo o por WhatsApp, sin tarjetas.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
            <Link to="/catalogo">
              <Button leftIcon={<Sparkles className="h-4 w-4" />}>
                Explorar catálogo
              </Button>
            </Link>
            <Link to="/informacion-pedidos">
              <Button variant="outline" leftIcon={<BookOpen className="h-4 w-4" />}>
                ¿Cómo pedir?
              </Button>
            </Link>
            <Button
              variant="ghost"
              leftIcon={<MessageCircle className="h-4 w-4 text-sky-600" />}
              onClick={() => window.dispatchEvent(new CustomEvent('pequemodas:open-chat'))}
            >
              Chat con la tienda
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          {/* Lista de Artículos estilo Boutique */}
          <div className="lg:col-span-7 space-y-3">
            {items.map((item) => {
              const subtotal = roundMoney(item.unitPriceCup * item.quantity);
              const attrs = Object.entries(item.attributes)
                .map(([k, v]) => `${k}: ${v}`)
                .join(' · ');

              return (
                <div
                  key={item.key}
                  className="rounded-3xl bg-white border border-slate-200/90 p-3.5 sm:p-4 shadow-sm hover:border-brand-200 transition-all flex gap-3.5 items-center"
                >
                  <Link
                    to={`/producto/${item.productSlug}`}
                    className="h-24 w-24 rounded-2xl bg-slate-100 overflow-hidden shrink-0 border border-slate-100"
                  >
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
                  </Link>

                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        to={`/producto/${item.productSlug}`}
                        className="font-heading font-extrabold text-sm sm:text-base text-slate-900 hover:text-brand-600 line-clamp-1"
                      >
                        {item.productName}
                      </Link>
                      <button
                        type="button"
                        aria-label="Quitar producto"
                        onClick={() => removeItem(item.key)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {item.variantName && (
                        <span className="rounded-full bg-sky-50 border border-sky-200 px-2.5 py-0.5 text-[11px] font-bold text-sky-800">
                          {item.variantName}
                        </span>
                      )}
                      {attrs && (
                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
                          {attrs}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <div className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 p-0.5">
                        <button
                          type="button"
                          aria-label="Disminuir cantidad"
                          onClick={() => updateQuantity(item.key, item.quantity - 1)}
                          className="h-7 w-7 rounded-full flex items-center justify-center text-slate-700 hover:bg-white shadow-sm"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="px-3 text-xs font-extrabold text-slate-900">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          aria-label="Aumentar cantidad"
                          onClick={() => updateQuantity(item.key, item.quantity + 1)}
                          className="h-7 w-7 rounded-full flex items-center justify-center text-slate-700 hover:bg-white shadow-sm"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="text-right">
                        <p className="text-[11px] text-slate-400">
                          {formatMoney(item.unitPriceCup, item.currencyCode)} c/u
                        </p>
                        <p className="font-heading font-extrabold text-sm sm:text-base text-brand-600">
                          {formatMoney(subtotal, item.currencyCode)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Panel Derecho Sticky con Resumen y Elección de Canal */}
          <div className="lg:col-span-5 lg:sticky lg:top-24 space-y-3.5">
            <div className="rounded-3xl bg-gradient-to-r from-brand-50/90 via-white to-sky-50/90 border border-brand-200/80 p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Total estimado ({totalQuantity} uds.)
                </p>
                <CurrencyTotals totals={totalsByCurrency} showNote />
              </div>
              <span className="inline-flex items-center gap-1 rounded-full bg-white border border-slate-200 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                <ShieldCheck className="h-3.5 w-3.5" /> Sin pago online
              </span>
            </div>

            <div className="space-y-1.5">
              <p className="text-xs font-extrabold text-slate-700 px-1">
                ¿Por dónde prefieres enviar tu pedido?
              </p>
              <div className="grid grid-cols-2 gap-2 rounded-2xl bg-white p-1.5 border border-slate-200 shadow-sm">
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
            </div>

            {checkoutChannel === 'app' ? (
              <DirectAppCheckoutCard
                items={items}
                totalsByCurrency={totalsByCurrency}
                onOrderCompleted={() => {
                  setJustSubmittedInApp(true);
                  clearCart();
                }}
              />
            ) : (
              <WhatsAppCheckoutCard items={items} totalsByCurrency={totalsByCurrency} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
