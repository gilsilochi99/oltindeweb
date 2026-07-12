
'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

const STORAGE_KEY = 'oltinde:preferredCity';

interface CityPreferenceContextValue {
  city: string; // 'all' or a specific city name
  setCity: (city: string) => void;
}

const CityPreferenceContext = createContext<CityPreferenceContextValue | undefined>(undefined);

export function CityPreferenceProvider({ children }: { children: ReactNode }) {
  const [city, setCityState] = useState<string>('all');

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored) setCityState(stored);
  }, []);

  const setCity = (next: string) => {
    setCityState(next);
    if (next === 'all') {
      window.localStorage.removeItem(STORAGE_KEY);
    } else {
      window.localStorage.setItem(STORAGE_KEY, next);
    }
  };

  return (
    <CityPreferenceContext.Provider value={{ city, setCity }}>
      {children}
    </CityPreferenceContext.Provider>
  );
}

// Selects the effective city for a page: an explicit URL `city` param always wins
// (so shared/bookmarked links stay accurate), otherwise falls back to the user's
// persisted sitewide preference so it doesn't silently reset on every navigation.
export function useCityPreference() {
  const ctx = useContext(CityPreferenceContext);
  if (!ctx) {
    throw new Error('useCityPreference must be used within a CityPreferenceProvider');
  }
  return ctx;
}
