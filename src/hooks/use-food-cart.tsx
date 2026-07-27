
'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

const STORAGE_KEY = 'oltinde:foodCart';

export interface FoodCartItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

interface FoodCartState {
  companyId: string;
  companyName: string;
  items: FoodCartItem[];
}

interface FoodCartContextValue {
  companyId: string | null;
  companyName: string | null;
  items: FoodCartItem[];
  subtotal: number;
  itemCount: number;
  // Returns false (and does nothing) if the cart already holds items from a
  // different restaurant — the caller should confirm with the user and then
  // call replaceCart before retrying.
  addItem: (companyId: string, companyName: string, item: Omit<FoodCartItem, 'quantity'>, quantity?: number) => boolean;
  replaceCart: (companyId: string, companyName: string, item: Omit<FoodCartItem, 'quantity'>, quantity?: number) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  removeItem: (menuItemId: string) => void;
  clearCart: () => void;
}

const FoodCartContext = createContext<FoodCartContextValue | undefined>(undefined);

const emptyState: FoodCartState = { companyId: '', companyName: '', items: [] };

export function FoodCartProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FoodCartState>(emptyState);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        setState(JSON.parse(stored));
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const persist = (next: FoodCartState) => {
    setState(next);
    if (next.items.length === 0) {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
  };

  const upsertItem = (base: FoodCartState, item: Omit<FoodCartItem, 'quantity'>, quantity: number): FoodCartState => {
    const existing = base.items.find(i => i.menuItemId === item.menuItemId);
    const items = existing
      ? base.items.map(i => i.menuItemId === item.menuItemId ? { ...i, quantity: i.quantity + quantity } : i)
      : [...base.items, { ...item, quantity }];
    return { ...base, items };
  };

  const addItem: FoodCartContextValue['addItem'] = (companyId, companyName, item, quantity = 1) => {
    if (state.items.length > 0 && state.companyId !== companyId) {
      return false;
    }
    persist(upsertItem({ companyId, companyName, items: state.items }, item, quantity));
    return true;
  };

  const replaceCart: FoodCartContextValue['replaceCart'] = (companyId, companyName, item, quantity = 1) => {
    persist(upsertItem({ companyId, companyName, items: [] }, item, quantity));
  };

  const updateQuantity = (menuItemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(menuItemId);
      return;
    }
    persist({ ...state, items: state.items.map(i => i.menuItemId === menuItemId ? { ...i, quantity } : i) });
  };

  const removeItem = (menuItemId: string) => {
    const items = state.items.filter(i => i.menuItemId !== menuItemId);
    persist(items.length === 0 ? emptyState : { ...state, items });
  };

  const clearCart = () => {
    persist(emptyState);
  };

  const subtotal = state.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const itemCount = state.items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <FoodCartContext.Provider
      value={{
        companyId: state.companyId || null,
        companyName: state.companyName || null,
        items: state.items,
        subtotal,
        itemCount,
        addItem,
        replaceCart,
        updateQuantity,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </FoodCartContext.Provider>
  );
}

export function useFoodCart() {
  const ctx = useContext(FoodCartContext);
  if (!ctx) {
    throw new Error('useFoodCart must be used within a FoodCartProvider');
  }
  return ctx;
}
