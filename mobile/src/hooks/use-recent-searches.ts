// AsyncStorage port of the web app's use-recent-searches.tsx (localStorage-backed
// there) — same shape (recent, addSearch, clearSearches) so it drops into the
// ported SearchExperience UI unchanged.
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'oltinde:recentSearches';
const MAX_ITEMS = 4;

async function readStored(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

export function useRecentSearches() {
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    readStored().then(setRecent);
  }, []);

  function addSearch(query: string) {
    const trimmed = query.trim();
    if (!trimmed) return;
    setRecent((prev) => {
      const next = [trimmed, ...prev.filter((q) => q.toLowerCase() !== trimmed.toLowerCase())].slice(0, MAX_ITEMS);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  function clearSearches() {
    setRecent([]);
    AsyncStorage.removeItem(STORAGE_KEY);
  }

  return { recent, addSearch, clearSearches };
}
