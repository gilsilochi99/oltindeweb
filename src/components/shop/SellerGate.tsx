'use client';

import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { CompanyPremiumRequired } from '@/components/shared/CompanyPremiumRequired';
import type { Company } from '@/lib/types';
import { useSellerCompany } from './useSellerCompany';

// Renders children only once useSellerCompany() has cleared the caller.
export function SellerGate({ companyId, children }: { companyId: string; children: (company: Company) => ReactNode }) {
  const { state } = useSellerCompany(companyId);

  if (state.status === 'loading') {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-black" />
      </div>
    );
  }
  if (state.status === 'forbidden') notFound();
  if (state.status === 'premium-required') return <CompanyPremiumRequired companyName={state.company.name} />;
  return <>{children(state.company)}</>;
}
