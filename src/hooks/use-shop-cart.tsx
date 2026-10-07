'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { MAX_CART_QUANTITY, type CartLine } from '@/lib/shop/types';

// Marketplace cart. Only variant ids and quantities are stored (localStorage,
// shared across tabs); names, prices and stock are always fetched live with
// getCartDetails(), so the cart never shows a stale price.

const STORAGE_KEY = 'oltinde:shopCart';
const MAX_LINES = 50;

interface ShopCartContextValue {
  lines: CartLine[];
  itemCount: number;
  ready: boolean; // false until localStorage has been read
  addItem: (variantId: string, quantity?: number) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  removeMany: (variantIds: string[]) => void;
  clear: () => void;
}

const ShopCartContext = createContext<ShopCartContextValue | undefined>(undefined);

function read(): CartLine[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((l): l is CartLine => typeof l?.variantId === 'string' && Number.isInteger(l?.quantity) && l.quantity > 0)
      .slice(0, MAX_LINES);
  } catch {
    return [];
  }
}

function write(lines: CartLine[]) {
  try {
    if (lines.length === 0) window.localStorage.removeItem(STORAGE_KEY);
    else window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
  } catch {
    // storage unavailable (private mode): the cart still works for this tab
  }
}

export function ShopCartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLines(read());
    setReady(true);
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setLines(read());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const update = useCallback((fn: (prev: CartLine[]) => CartLine[]) => {
    setLines(prev => {
      const next = fn(prev);
      write(next);
      return next;
    });
  }, []);

  const value = useMemo<ShopCartContextValue>(() => ({
    lines,
    ready,
    itemCount: lines.reduce((n, l) => n + l.quantity, 0),
    addItem: (variantId, quantity = 1) => update(prev => {
      const existing = prev.find(l => l.variantId === variantId);
      if (existing) {
        return prev.map(l => (l.variantId === variantId ? { ...l, quantity: Math.min(MAX_CART_QUANTITY, l.quantity + quantity) } : l));
      }
      return [...prev, { variantId, quantity: Math.min(MAX_CART_QUANTITY, quantity) }].slice(-MAX_LINES);
    }),
    setQuantity: (variantId, quantity) => update(prev => (quantity <= 0
      ? prev.filter(l => l.variantId !== variantId)
      : prev.map(l => (l.variantId === variantId ? { ...l, quantity: Math.min(MAX_CART_QUANTITY, quantity) } : l)))),
    removeItem: variantId => update(prev => prev.filter(l => l.variantId !== variantId)),
    removeMany: ids => update(prev => prev.filter(l => !ids.includes(l.variantId))),
    clear: () => update(() => []),
  }), [lines, ready, update]);

  return <ShopCartContext.Provider value={value}>{children}</ShopCartContext.Provider>;
}

export function useShopCart() {
  const ctx = useContext(ShopCartContext);
  if (!ctx) throw new Error('useShopCart must be used within a ShopCartProvider');
  return ctx;
}
