import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  FolderTree,
  MessageCircle,
  Search,
  ShoppingBag,
  Sparkles,
  X
} from 'lucide-react';
import {
  detectStoreSearchIntent,
  formatCup,
  scoreSmartTextMatch,
  suggestDidYouMean
} from '@pequemodas/utils';
import { useCart } from '../context/CartContext';
import { useStorefront } from '../context/StorefrontContext';

interface SmartSearchBoxProps {
  value: string;
  onChange: (val: string) => void;
  onSubmitSearch?: (val: string) => void;
  placeholder?: string;
  compact?: boolean;
  autoFocusInput?: boolean;
}

export function SmartSearchBox({
  value,
  onChange,
  onSubmitSearch,
  placeholder = 'Busca ropa, juguetes o escribe "carrito"...',
  compact = false,
  autoFocusInput = false
}: SmartSearchBoxProps) {
  const navigate = useNavigate();
  const { categories } = useStorefront();
  const { items: cartItems, totalQuantity, estimatedTotalCup } = useCart();
  const [focused, setFocused] = useState(false);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (autoFocusInput) {
      inputRef.current?.focus();
    }
  }, [autoFocusInput]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const categoryVocab = useMemo(() => categories.map((c) => c.name), [categories]);
  const cartVocab = useMemo(() => cartItems.map((i) => i.productName), [cartItems]);

  const didYouMean = useMemo(
    () => suggestDidYouMean(value, [...categoryVocab, ...cartVocab]),
    [value, categoryVocab, cartVocab]
  );

  const intent = useMemo(() => detectStoreSearchIntent(value), [value]);

  const matchingCategories = useMemo(() => {
    if (value.trim().length < 2) return [];
    return categories
      .filter((c) => scoreSmartTextMatch(value, [c.name, c.description ?? '']) > 0)
      .slice(0, 3);
  }, [categories, value]);

  const matchingInCart = useMemo(() => {
    if (value.trim().length < 2) return [];
    return cartItems
      .filter((i) => scoreSmartTextMatch(value, [i.productName, i.variantName ?? '']) > 0)
      .slice(0, 2);
  }, [cartItems, value]);

  const triggerSearch = (term: string) => {
    setFocused(false);
    if (onSubmitSearch) {
      onSubmitSearch(term);
    } else {
      const clean = term.trim();
      navigate(clean ? `/buscar?q=${encodeURIComponent(clean)}` : '/catalogo');
    }
  };

  const showDropdown =
    focused &&
    value.trim().length >= 2 &&
    Boolean(intent || didYouMean || matchingCategories.length || matchingInCart.length);

  return (
    <div ref={boxRef} className="relative w-full">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault();
          triggerSearch(value);
        }}
        className="relative flex items-center"
      >
        <Search className="h-4 w-4 text-slate-400 absolute left-3.5 pointer-events-none" />
        <input
          ref={inputRef}
          type="search"
          value={value}
          onFocus={() => setFocused(true)}
          onChange={(e) => {
            onChange(e.target.value);
            setFocused(true);
          }}
          placeholder={placeholder}
          aria-label="Buscar productos o acciones"
          className={`w-full rounded-full border border-slate-200 bg-slate-50/90 pl-9 pr-9 text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-brand-400 focus:ring-2 focus:ring-brand-100 focus:outline-none transition-all ${
            compact ? 'py-2' : 'py-2.5'
          }`}
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="Limpiar búsqueda"
            className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-700"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </form>

      {showDropdown && (
        <div className="absolute left-0 right-0 top-full mt-2 z-50 rounded-2xl bg-white border border-brand-100 shadow-elevated p-2.5 space-y-2 text-xs">
          {didYouMean && (
            <button
              type="button"
              onClick={() => {
                onChange(didYouMean);
                triggerSearch(didYouMean);
              }}
              className="w-full flex items-center justify-between gap-2 rounded-xl bg-amber-50/90 hover:bg-amber-100/80 border border-amber-200/80 px-3 py-2 text-left text-amber-950 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                <span>
                  ¿Quisiste decir <strong className="underline">«{didYouMean}»</strong>?
                </span>
              </span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0" />
            </button>
          )}

          {intent?.kind === 'cart' && (
            <button
              type="button"
              onClick={() => {
                setFocused(false);
                navigate('/carrito');
              }}
              className="w-full flex items-center justify-between gap-2 rounded-xl bg-brand-50 hover:bg-brand-100/80 border border-brand-200 px-3 py-2.5 text-left transition-colors"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="h-8 w-8 rounded-xl bg-brand-600 text-white flex items-center justify-center shrink-0">
                  <ShoppingBag className="h-4 w-4" />
                </span>
                <div className="truncate">
                  <p className="font-extrabold text-slate-900">
                    {totalQuantity > 0
                      ? `Tu Carrito: ${totalQuantity} artículo(s) · ${formatCup(estimatedTotalCup)}`
                      : 'Ir a tu Carrito de Pedido (vacío)'}
                  </p>
                  <p className="text-[11px] text-slate-600 truncate">
                    Toca para revisar tus productos o enviar tu compra
                  </p>
                </div>
              </div>
              <ArrowRight className="h-4 w-4 text-brand-700 shrink-0" />
            </button>
          )}

          {intent?.kind === 'order_guide' && (
            <button
              type="button"
              onClick={() => {
                setFocused(false);
                navigate('/informacion-pedidos');
              }}
              className="w-full flex items-center justify-between gap-2 rounded-xl bg-sky-50 hover:bg-sky-100/80 border border-sky-200 px-3 py-2.5 text-left"
            >
              <span className="flex items-center gap-2 font-bold text-sky-950">
                <BookOpen className="h-4 w-4 text-sky-600 shrink-0" />
                <span>Ver guía visual de Cómo Pedir paso a paso</span>
              </span>
              <ArrowRight className="h-4 w-4 text-sky-700 shrink-0" />
            </button>
          )}

          {intent?.kind === 'chat' && (
            <button
              type="button"
              onClick={() => {
                setFocused(false);
                window.dispatchEvent(new CustomEvent('pequemodas:open-chat'));
              }}
              className="w-full flex items-center justify-between gap-2 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 px-3 py-2.5 text-left"
            >
              <span className="flex items-center gap-2 font-bold text-emerald-950">
                <MessageCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Abrir chat directo con Katia ahora</span>
              </span>
              <ArrowRight className="h-4 w-4 text-emerald-700 shrink-0" />
            </button>
          )}

          {matchingInCart.length > 0 && (
            <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 space-y-1">
              <p className="text-[10px] font-extrabold uppercase text-slate-500">
                Ya en tu carrito:
              </p>
              {matchingInCart.map((ci) => (
                <button
                  key={ci.key}
                  type="button"
                  onClick={() => {
                    setFocused(false);
                    navigate('/carrito');
                  }}
                  className="w-full flex items-center justify-between text-left font-semibold text-slate-800 hover:text-brand-600"
                >
                  <span className="truncate">
                    🛍️ {ci.productName} (x{ci.quantity})
                  </span>
                  <span className="text-brand-600 font-bold shrink-0">Ver en carrito →</span>
                </button>
              ))}
            </div>
          )}

          {matchingCategories.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {matchingCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setFocused(false);
                    navigate(`/categorias/${cat.slug}`);
                  }}
                  className="inline-flex items-center gap-1 rounded-full bg-slate-100 hover:bg-brand-50 px-2.5 py-1 font-bold text-slate-700 hover:text-brand-700"
                >
                  <FolderTree className="h-3 w-3" />
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
