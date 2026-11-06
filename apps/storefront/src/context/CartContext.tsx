import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { roundMoney } from '@pequemodas/utils';

export interface CartItem {
  key: string;
  productId: string;
  productSlug: string;
  productName: string;
  variantId: string | null;
  variantName: string | null;
  attributes: Record<string, string>;
  unitPriceCup: number;
  quantity: number;
  maxQuantity: number | null;
  thumbnailUrl: string | null;
}

interface CartContextValue {
  items: CartItem[];
  totalQuantity: number;
  estimatedTotalCup: number;
  addItem: (item: Omit<CartItem, 'key'>) => void;
  updateQuantity: (key: string, quantity: number) => void;
  removeItem: (key: string) => void;
  clearCart: () => void;
}

const STORAGE_KEY = 'pequemodas.cart.v1';
const CartContext = createContext<CartContextValue | null>(null);

function loadInitialCart(): CartItem[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CartItem[]) : [];
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
      if (existing) {
        const nextQty = existing.quantity + incoming.quantity;
        const capped =
          incoming.maxQuantity !== null ? Math.min(nextQty, incoming.maxQuantity) : nextQty;
        return prev.map((i) =>
          i.key === key
            ? { ...i, quantity: Math.max(1, capped), unitPriceCup: incoming.unitPriceCup }
            : i
        );
      }
      const capped =
        incoming.maxQuantity !== null
          ? Math.min(incoming.quantity, incoming.maxQuantity)
          : incoming.quantity;
      return [...prev, { ...incoming, key, quantity: Math.max(1, capped) }];
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
    const estimatedTotalCup = items.reduce(
      (sum, i) => roundMoney(sum + roundMoney(i.unitPriceCup * i.quantity)),
      0
    );
    return { totalQuantity, estimatedTotalCup };
  }, [items]);

  return (
    <CartContext.Provider
      value={{
        items,
        totalQuantity: totals.totalQuantity,
        estimatedTotalCup: totals.estimatedTotalCup,
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
