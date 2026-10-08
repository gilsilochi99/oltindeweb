// Mirrors src/hooks/use-food-cart.tsx on the web app — same cart shape,
// same single-restaurant-at-a-time rule, same lineId strategy so identical
// item+option combos stack instead of creating duplicate lines. Persisted to
// AsyncStorage instead of localStorage.
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'oltinde:foodCart';

export interface FoodCartSelectedOption {
  groupName: string;
  optionName: string;
  priceDelta: number;
}

export interface FoodCartItem {
  lineId: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  selectedOptions?: FoodCartSelectedOption[];
}

interface FoodCartState {
  companyId: string;
  companyName: string;
  items: FoodCartItem[];
}

type NewCartItem = Omit<FoodCartItem, 'quantity' | 'lineId'>;

function buildLineId(item: NewCartItem): string {
  const optionsKey = (item.selectedOptions || [])
    .map((o) => `${o.groupName}:${o.optionName}`)
    .sort()
    .join('|');
  return optionsKey ? `${item.menuItemId}::${optionsKey}` : item.menuItemId;
}

interface FoodCartContextValue {
  companyId: string | null;
  companyName: string | null;
  items: FoodCartItem[];
  subtotal: number;
  itemCount: number;
  addItem: (companyId: string, companyName: string, item: NewCartItem, quantity?: number) => boolean;
  replaceCart: (companyId: string, companyName: string, item: NewCartItem, quantity?: number) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  removeItem: (lineId: string) => void;
  clearCart: () => void;
}

const FoodCartContext = createContext<FoodCartContextValue | undefined>(undefined);

const emptyState: FoodCartState = { companyId: '', companyName: '', items: [] };

export function FoodCartProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FoodCartState>(emptyState);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (!stored) return;
      try {
        setState(JSON.parse(stored));
      } catch {
        AsyncStorage.removeItem(STORAGE_KEY);
      }
    });
  }, []);

  const persist = (next: FoodCartState) => {
    setState(next);
    if (next.items.length === 0) {
      AsyncStorage.removeItem(STORAGE_KEY);
    } else {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    }
  };

  const upsertItem = (base: FoodCartState, item: NewCartItem, quantity: number): FoodCartState => {
    const lineId = buildLineId(item);
    const existing = base.items.find((i) => i.lineId === lineId);
    const items = existing
      ? base.items.map((i) => (i.lineId === lineId ? { ...i, quantity: i.quantity + quantity } : i))
      : [...base.items, { ...item, lineId, quantity }];
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

  const updateQuantity = (lineId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(lineId);
      return;
    }
    persist({ ...state, items: state.items.map((i) => (i.lineId === lineId ? { ...i, quantity } : i)) });
  };

  const removeItem = (lineId: string) => {
    const items = state.items.filter((i) => i.lineId !== lineId);
    persist(items.length === 0 ? emptyState : { ...state, items });
  };

  const clearCart = () => persist(emptyState);

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
  if (!ctx) throw new Error('useFoodCart must be used within a FoodCartProvider');
  return ctx;
}
