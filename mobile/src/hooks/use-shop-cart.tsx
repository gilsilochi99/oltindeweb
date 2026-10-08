// Tienda cart: only variant ids and quantities, like the web cart — prices,
// stock and availability always come from the server (getCartDetails).
// Persisted to AsyncStorage. Separate from the food cart (use-food-cart).
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MAX_CART_QUANTITY, type CartLine } from '../lib/shop';

const STORAGE_KEY = 'oltinde:shopCart';

interface ShopCartContextValue {
  lines: CartLine[];
  itemCount: number;
  add: (variantId: string, quantity?: number) => void;
  setQuantity: (variantId: string, quantity: number) => void;
  remove: (variantIds: string | string[]) => void;
  clear: () => void;
}

const ShopCartContext = createContext<ShopCartContextValue | undefined>(undefined);

export function ShopCartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (!stored) return;
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setLines(parsed.filter((l) => l && typeof l.variantId === 'string' && l.quantity > 0));
      })
      .catch(() => AsyncStorage.removeItem(STORAGE_KEY))
      .finally(() => setLoaded(true));
  }, []);

  useEffect(() => {
    if (loaded) AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(lines)).catch(() => {});
  }, [lines, loaded]);

  const add = useCallback((variantId: string, quantity = 1) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.variantId === variantId);
      if (existing) {
        return prev.map((l) => (l.variantId === variantId ? { ...l, quantity: Math.min(MAX_CART_QUANTITY, l.quantity + quantity) } : l));
      }
      return [...prev, { variantId, quantity: Math.min(MAX_CART_QUANTITY, quantity) }];
    });
  }, []);

  const setQuantity = useCallback((variantId: string, quantity: number) => {
    setLines((prev) =>
      quantity <= 0
        ? prev.filter((l) => l.variantId !== variantId)
        : prev.map((l) => (l.variantId === variantId ? { ...l, quantity: Math.min(MAX_CART_QUANTITY, quantity) } : l)),
    );
  }, []);

  const remove = useCallback((variantIds: string | string[]) => {
    const ids = new Set(Array.isArray(variantIds) ? variantIds : [variantIds]);
    setLines((prev) => prev.filter((l) => !ids.has(l.variantId)));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo(
    () => ({ lines, itemCount: lines.reduce((n, l) => n + l.quantity, 0), add, setQuantity, remove, clear }),
    [lines, add, setQuantity, remove, clear],
  );

  return <ShopCartContext.Provider value={value}>{children}</ShopCartContext.Provider>;
}

export function useShopCart() {
  const ctx = useContext(ShopCartContext);
  if (!ctx) throw new Error('useShopCart must be used inside ShopCartProvider');
  return ctx;
}
