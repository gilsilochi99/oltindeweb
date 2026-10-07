'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { getCompanyById } from '@/lib/data';
import type { Company } from '@/lib/types';

type SellerState =
  | { status: 'loading' }
  | { status: 'forbidden' }
  | { status: 'premium-required'; company: Company }
  | { status: 'ready'; company: Company };

// Shared gate for the seller dashboard pages: signed in, owner of the
// company (or admin/manager), and the company is premium. The server
// actions enforce the same rules; this only decides what to render.
export function useSellerCompany(companyId: string) {
  const { user, loading: authLoading, isAdmin, isManager } = useAuth();
  const router = useRouter();
  const [state, setState] = useState<SellerState>({ status: 'loading' });
  const isStaff = isAdmin || isManager;

  useEffect(() => {
    if (!authLoading && !user) router.push('/signin');
  }, [authLoading, user, router]);

  const load = useCallback(async () => {
    if (!user) return;
    const company = await getCompanyById(companyId);
    if (!company || (company.ownerId !== user.uid && !isStaff)) {
      setState({ status: 'forbidden' });
    } else if (!company.isPremium && !isStaff) {
      setState({ status: 'premium-required', company });
    } else {
      setState({ status: 'ready', company });
    }
  }, [user, companyId, isStaff]);

  useEffect(() => {
    load();
  }, [load]);

  return { state, user };
}
