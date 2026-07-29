
'use client';

import { useCallback, useEffect, useState } from 'react';
import { getCompanies, getInstitutions, getProcedures, getPublishedPosts, getServices, getUniqueCities, getJobPostings, getEvents, getAllMenuItems, getProfessionals } from '@/lib/data';
import type { Company, Institution, Procedure, Post, Service, JobPosting, CalendarEvent, Professional } from '@/lib/types';
import type { SearchInputData } from '@/lib/search-engine';

interface SearchData extends SearchInputData {
  cities: string[];
}

const EMPTY_DATA: SearchData = { companies: [], institutions: [], procedures: [], posts: [], services: [], jobs: [], events: [], menuItems: [], professionals: [], cities: [] };

// Fetches the full dataset the rule-based search engine (src/lib/search-engine.ts)
// needs, once. Shared by GlobalHeaderSearch's chat window and the /search page so
// both stay in sync and only fetch each collection a single time per mount.
export function useSearchData() {
  const [data, setData] = useState<SearchData>(EMPTY_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const retry = useCallback(() => setAttempt((a) => a + 1), []);

  useEffect(() => {
    let cancelled = false;
    async function fetchData() {
      setIsLoading(true);
      setError(null);
      try {
        const [companies, institutions, procedures, posts, services, cities, jobs, events, menuItems, professionals] = await Promise.all([
          getCompanies(),
          getInstitutions(),
          getProcedures(),
          getPublishedPosts(),
          getServices(),
          getUniqueCities(),
          getJobPostings(),
          getEvents(),
          getAllMenuItems(),
          getProfessionals(),
        ]);
        if (cancelled) return;
        setData({ companies, institutions, procedures, posts, services, cities, jobs, events, menuItems, professionals });
        setIsLoading(false);
      } catch (err) {
        if (cancelled) return;
        console.error('Failed to load search data', err);
        setData(EMPTY_DATA);
        setError('No se pudieron cargar los datos. Compruebe su conexión e intente de nuevo.');
        setIsLoading(false);
      }
    }
    fetchData();
    return () => { cancelled = true; };
  }, [attempt]);

  return { ...data, isLoading, error, retry };
}

export type { Company, Institution, Procedure, Post, Service, JobPosting, CalendarEvent, Professional };
