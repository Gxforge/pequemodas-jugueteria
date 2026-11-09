import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { CurrencyCode } from '@pequemodas/config';
import { notifyCartAdditionQuietly } from '@pequemodas/shared';
import {
  getCurrencyTotal,
  normalizeCurrencyCode,
  sumCurrencyTotals,
  type CurrencyTotal
} from '@pequemodas/utils';

export interface CartItem {
  key: string;
  productId: string;
  productSlug: string;
  productName: string;
  variantId: string | null;
  variantName: string | null;
  attributes: Record<string, string>;
  // Importe numérico histórico; la moneda real está en currencyCode.
  unitPriceCup: number;
  currencyCode: CurrencyCode;
  quantity: number;
  maxQuantity: number | null;
  thumbnailUrl: string | null;
}

interface CartContextValue {
  items: CartItem[];
  totalQuantity: number;
  estimatedTotalCup: number;
  totalsByCurrency: CurrencyTotal[];
  addItem: (item: Omit<CartItem, 'key'>) => void;
  updateQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  clearCart: () => void;
}

const STORAGE_KEY = 'pequemodas.cart.v1';
const CartContext = createContext<CartContextValue | null>(null);

function toTotals(items: CartItem[]): CurrencyTotal[] {
  return sumCurrencyTotals(
    items.map((item) => ({
      unitPrice: item.unitPriceCup,
      quantity: item.quantity,
      currencyCode: item.currencyCode
    }))
  );
}

function loadInitialCart(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return (parsed as CartItem[]).map((item) => ({
      ...item,
      currencyCode: normalizeCurrencyCode(item.currencyCode)
    }));
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(loadInitialCart);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignora bloqueo de almacenamiento privado
    }
  }, [items]);

  const addItem = (incoming: Omit<CartItem, 'key'>) => {
    const key = `${incoming.productId}::${incoming.variantId ?? 'base'}`;
    setItems((prev) => {
      const existing = prev.find((i) => i.key === key);
      let nextList: CartItem[];
      if (existing) {
        const nextQty = existing.quantity + incoming.quantity;
        const capped =
          incoming.maxQuantity !== null ? Math.min(nextQty, incoming.maxQuantity) : nextQty;
        nextList = prev.map((i) =>
          i.key === key
            ? {
                ...i,
                quantity: Math.max(1, capped),
                unitPriceCup: incoming.unitPriceCup,
                currencyCode: incoming.currencyCode
              }
            : i
        );
      } else {
        const capped =
          incoming.maxQuantity !== null
            ? Math.min(incoming.quantity, incoming.maxQuantity)
            : incoming.quantity;
        nextList = [...prev, { ...incoming, key, quantity: Math.max(1, capped) }];
      }
      const nextTotals = toTotals(nextList);
      void notifyCartAdditionQuietly({
        productName: incoming.productName,
        cartCount: nextList.reduce((s, x) => s + x.quantity, 0),
        estimatedCup: getCurrencyTotal(nextTotals, 'CUP'),
        totalsByCurrency: nextTotals
      });
      return nextList;
    });
  };

  const updateQuantity = (key: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.key !== key));
      return;
    }
    setItems((prev) =>
      prev.map((i) => {
        if (i.key !== key) return i;
        const capped = i.maxQuantity !== null ? Math.min(quantity, i.maxQuantity) : quantity;
        return { ...i, quantity: Math.max(1, capped) };
      })
    );
  };

  const removeItem = (key: string) => {
    setItems((prev) => prev.filter((i) => i.key !== key));
  };

  const clearCart = () => setItems([]);

  const totals = useMemo(() => {
    const totalQuantity = items.reduce((sum, i) => sum + i.quantity, 0);
    const totalsByCurrency = toTotals(items);
    return {
      totalQuantity,
      totalsByCurrency,
      estimatedTotalCup: getCurrencyTotal(totalsByCurrency, 'CUP')
    };
  }, [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        totalQuantity: totals.totalQuantity,
        estimatedTotalCup: totals.estimatedTotalCup,
        totalsByCurrency: totals.totalsByCurrency,
        addItem,
        updateQuantity,
        removeItem,
        clearCart
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart debe usarse dentro de CartProvider.');
  return ctx;
}
