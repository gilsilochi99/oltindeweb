'use client';

import { use } from 'react';
import { SellerGate } from '@/components/shop/SellerGate';
import { RentalNewView } from '@/components/rentals/dashboard/RentalNewView';
import { companyRentalOwner } from '@/components/rentals/dashboard/owner';

export default function NewRentalPage({ params }: { params: Promise<{ companyId: string }> }) {
  const { companyId } = use(params);
  return <SellerGate companyId={companyId} feature="rentals">{company => <RentalNewView owner={companyRentalOwner(company)} />}</SellerGate>;
}
