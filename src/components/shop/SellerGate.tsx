'use client';

import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { CompanyPremiumRequired } from '@/components/shared/CompanyPremiumRequired';
import type { Company } from '@/lib/types';
import type { PremiumFeature } from '@/lib/premium-features';
import { useSellerCompany } from './useSellerCompany';

// Renders children only once useSellerCompany() has cleared the caller.
export function SellerGate({ companyId, feature = 'shop', children }: { companyId: string; feature?: PremiumFeature; children: (company: Company) => ReactNode }) {
  const { state } = useSellerCompany(companyId, feature);

  if (state.status === 'loading') {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-black" />
      </div>
    );
  }
  if (state.status === 'forbidden') notFound();
  if (state.status === 'premium-required') return <CompanyPremiumRequired companyName={state.company.name} feature={feature} isPremium={state.company.isPremium} category={state.company.category} />;
  return <>{children(state.company)}</>;
}
