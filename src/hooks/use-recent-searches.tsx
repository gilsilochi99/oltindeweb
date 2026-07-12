
'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'oltinde:recentSearches';
const MAX_ITEMS = 4;

function readStored(): string[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

// Sitewide, localStorage-backed list of recent search queries — same persistence
// pattern as use-city-preference.tsx — shown on the search landing state so a
// returning visitor sees their own recent searches instead of only generic examples.
export function useRecentSearches() {
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    setRecent(readStored());
  }, []);

  function addSearch(query: string) {
    const trimmed = query.trim();
    if (!trimmed) return;
    setRecent((prev) => {
      const next = [trimmed, ...prev.filter((q) => q.toLowerCase() !== trimmed.toLowerCase())].slice(0, MAX_ITEMS);
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  function clearSearches() {
    setRecent([]);
    window.localStorage.removeItem(STORAGE_KEY);
  }

  return { recent, addSearch, clearSearches };
}
