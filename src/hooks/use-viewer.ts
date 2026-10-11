'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getCompaniesByOwner } from '@/lib/data';
import type { Company } from '@/lib/types';

// Who is looking at a public page, so its buttons can match:
// - 'guest': signed out;
// - 'no-business': signed in, no company;
// - 'business': signed in with at least one company (`allPremium` when every one is Premium).
// Public pages are rendered once for everyone, so this is decided in the browser.
export type ViewerKind = 'guest' | 'no-business' | 'business';

export function useViewer() {
  const { user, loading } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) { setCompanies([]); setChecked(true); return; }
    let cancelled = false;
    setChecked(false);
    getCompaniesByOwner(user.uid)
      .then(list => { if (!cancelled) setCompanies(list); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setChecked(true); });
    return () => { cancelled = true; };
  }, [user, loading]);

  const kind: ViewerKind = !user ? 'guest' : companies.length > 0 ? 'business' : 'no-business';
  return {
    ready: !loading && checked,
    kind,
    companies,
    allPremium: companies.length > 0 && companies.every(c => c.isPremium),
  };
}
